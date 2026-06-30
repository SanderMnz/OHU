import { useEffect, useState } from 'react'
import MenuProfessor from '../../components/MenuProfessor'
import Layout from '../../components/Layout'
import { Titulo, Subtitulo, Tabela } from '../../components/UI'
import { supabase } from '../../lib/supabase'

export default function ProfessorTurmas() {
  const [turmas, setTurmas] = useState([])
  const [turmaSelecionada, setTurmaSelecionada] = useState(null)
  const [alunos, setAlunos] = useState([])

  useEffect(() => { buscarTurmas() }, [])

  async function buscarTurmas() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase.from('turma_professor').select('turmas(*)').eq('professor_id', session.user.id)
    setTurmas(data?.map(t => t.turmas) || [])
  }

  async function selecionarTurma(turma) {
    setTurmaSelecionada(turma)
    const { data } = await supabase.from('turma_aluno').select('usuarios(id, nome, username)').eq('turma_id', turma.id)
    setAlunos(data?.map(a => a.usuarios) || [])
  }

  function labelPeriodo(turma) {
    const tipo = turma.tipo === 'eja' ? 'Trimestre' : 'Bimestre'
    return `${turma.periodo_ativo}º ${tipo}`
  }

  return (
    <Layout menu={<MenuProfessor />}>
      <Titulo>Minhas Turmas</Titulo>
      {turmas.length === 0 && <p className="text-gray-400">Nenhuma turma atribuida ainda.</p>}

      <Tabela cabecalho={['Turma', 'Ano/Serie', 'Periodo Ativo', 'Acoes']}>
        {turmas.map((turma) => (
          <tr key={turma.id} className={turmaSelecionada?.id === turma.id ? 'bg-blue-50' : 'hover:bg-gray-50'}>
            <td className="px-4 py-3 font-medium">{turma.nome}</td>
            <td className="px-4 py-3">{turma.ano_serie}</td>
            <td className="px-4 py-3">{labelPeriodo(turma)}</td>
            <td className="px-4 py-3">
              <button
                onClick={() => selecionarTurma(turma)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                {turmaSelecionada?.id === turma.id ? 'Selecionada' : 'Ver alunos'}
              </button>
            </td>
          </tr>
        ))}
      </Tabela>

      {turmaSelecionada && (
        <div className="mt-8">
          <Subtitulo>Alunos da Turma {turmaSelecionada.nome}</Subtitulo>
          <p className="text-gray-500 mb-4">Total: {alunos.length} alunos</p>

          {alunos.length === 0 && <p className="text-gray-400">Nenhum aluno nesta turma ainda.</p>}

          <Tabela cabecalho={['Nome', 'Usuario']}>
            {alunos.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{a.nome}</td>
                <td className="px-4 py-3 text-gray-500">{a.username}</td>
              </tr>
            ))}
          </Tabela>
        </div>
      )}
    </Layout>
  )
}