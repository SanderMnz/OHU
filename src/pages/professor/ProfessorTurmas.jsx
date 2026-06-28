import { useEffect, useState } from 'react'
import MenuProfessor from '../../components/MenuProfessor'
import { supabase } from '../../lib/supabase'

export default function ProfessorTurmas() {
  const [turmas, setTurmas] = useState([])
  const [turmaSelecionada, setTurmaSelecionada] = useState(null)
  const [alunos, setAlunos] = useState([])

  useEffect(() => {
    buscarTurmas()
  }, [])

  async function buscarTurmas() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase
      .from('turma_professor')
      .select('turmas(*)')
      .eq('professor_id', session.user.id)
    setTurmas(data?.map(t => t.turmas) || [])
  }

  async function selecionarTurma(turma) {
    setTurmaSelecionada(turma)
    const { data } = await supabase
      .from('turma_aluno')
      .select('usuarios(id, nome, username)')
      .eq('turma_id', turma.id)
    setAlunos(data?.map(a => a.usuarios) || [])
  }

  function labelPeriodo(turma) {
    const tipo = turma.tipo === 'eja' ? 'Trimestre' : 'Bimestre'
    return `${turma.periodo_ativo}º ${tipo}`
  }

  return (
    <div style={{ display: 'flex' }}>
      <MenuProfessor />
      <div style={{ padding: '20px' }}>
        <h1>Minhas Turmas</h1>

        {turmas.length === 0 && <p>Nenhuma turma atribuida ainda.</p>}

        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Turma</th>
              <th>Ano/Serie</th>
              <th>Periodo Ativo</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {turmas.map((turma) => (
              <tr key={turma.id} style={{ background: turmaSelecionada?.id === turma.id ? '#f0f0f0' : 'white' }}>
                <td>{turma.nome}</td>
                <td>{turma.ano_serie}</td>
                <td>{labelPeriodo(turma)}</td>
                <td>
                  <button onClick={() => selecionarTurma(turma)}>
                    {turmaSelecionada?.id === turma.id ? 'Selecionada' : 'Ver alunos'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {turmaSelecionada && (
          <div style={{ marginTop: '30px' }}>
            <h2>Alunos da Turma {turmaSelecionada.nome}</h2>
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
        )}
      </div>
    </div>
  )
}