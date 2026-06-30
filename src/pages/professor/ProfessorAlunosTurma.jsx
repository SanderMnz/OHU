import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MenuProfessor from '../../components/MenuProfessor'
import Layout from '../../components/Layout'
import { Titulo, Botao, Tabela } from '../../components/UI'
import { supabase } from '../../lib/supabase'

export default function ProfessorAlunosTurma() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [turma, setTurma] = useState(null)
  const [alunos, setAlunos] = useState([])

  useEffect(() => { buscarTurma(); buscarAlunos() }, [])

  async function buscarTurma() {
    const { data } = await supabase.from('turmas').select('*').eq('id', id).single()
    setTurma(data)
  }

  async function buscarAlunos() {
    const { data } = await supabase.from('turma_aluno').select('usuarios(id, nome, username)').eq('turma_id', id)
    setAlunos(data?.map(a => a.usuarios) || [])
  }

  if (!turma) return <Layout menu={<MenuProfessor />}><p className="text-gray-400">Carregando...</p></Layout>

  return (
    <Layout menu={<MenuProfessor />}>
      <Botao onClick={() => navigate('/professor/turmas')} variante="secondary">← Voltar</Botao>
      <Titulo>Alunos da Turma {turma.nome}</Titulo>
      <p className="text-gray-500 mb-4">Total: {alunos.length} alunos</p>

      {alunos.length === 0 && <p className="text-gray-400">Nenhum aluno nesta turma ainda.</p>}

      <Tabela cabecalho={['Nome', 'Usuário']}>
        {alunos.map(a => (
          <tr key={a.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-medium">{a.nome}</td>
            <td className="px-4 py-3 text-gray-500">{a.username}</td>
          </tr>
        ))}
      </Tabela>
    </Layout>
  )
}