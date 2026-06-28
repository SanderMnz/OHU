import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MenuProfessor from '../../components/MenuProfessor'
import { supabase } from '../../lib/supabase'

export default function ProfessorAlunosTurma() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [turma, setTurma] = useState(null)
  const [alunos, setAlunos] = useState([])

  useEffect(() => {
    buscarTurma()
    buscarAlunos()
  }, [])

  async function buscarTurma() {
    const { data } = await supabase
      .from('turmas')
      .select('*')
      .eq('id', id)
      .single()
    setTurma(data)
  }

  async function buscarAlunos() {
    const { data } = await supabase
      .from('turma_aluno')
      .select('usuarios(id, nome, username)')
      .eq('turma_id', id)
    setAlunos(data?.map(a => a.usuarios) || [])
  }

  if (!turma) return <p>Carregando...</p>

  return (
    <div style={{ display: 'flex' }}>
      <MenuProfessor />
      <div style={{ padding: '20px' }}>
        <button onClick={() => navigate('/professor/turmas')}>Voltar</button>
        <h1>Alunos da Turma {turma.nome}</h1>
        <p>Total: {alunos.length} alunos</p>

        {alunos.length === 0 && <p>Nenhum aluno nesta turma ainda.</p>}

        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Usuario</th>
            </tr>
          </thead>
          <tbody>
            {alunos.map(a => (
              <tr key={a.id}>
                <td>{a.nome}</td>
                <td>{a.username}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}