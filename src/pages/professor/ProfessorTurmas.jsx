import { useEffect, useState } from 'react'
import MenuProfessor from '../../components/MenuProfessor'
import { supabase } from '../../lib/supabase'

export default function ProfessorTurmas() {
  const [turmas, setTurmas] = useState([])
  const [usuarioId, setUsuarioId] = useState(null)

  useEffect(() => {
    buscarUsuario()
  }, [])

  async function buscarUsuario() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      setUsuarioId(session.user.id)
      buscarTurmas(session.user.id)
    }
  }

  async function buscarTurmas(id) {
    const { data } = await supabase
      .from('turma_professor')
      .select('turmas(*)')
      .eq('professor_id', id)
    setTurmas(data?.map(t => t.turmas) || [])
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
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {turmas.map((turma) => (
              <tr key={turma.id}>
                <td>{turma.nome}</td>
                <td>{turma.ano_serie}</td>
                <td>
                  <button>Ver alunos</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}