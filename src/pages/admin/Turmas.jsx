import { useEffect, useState } from 'react'
import MenuAdmin from '../../components/MenuAdmin'
import { supabase } from '../../lib/supabase'

export default function Turmas() {
  const [turmas, setTurmas] = useState([])
  const [professores, setProfessores] = useState([])
  const [nome, setNome] = useState('')
  const [anoSerie, setAnoSerie] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [professoresTurma, setProfessoresTurma] = useState({})
  const [professorSelecionado, setProfessorSelecionado] = useState({})

  async function buscarTurmas() {
    const { data } = await supabase
      .from('turmas')
      .select('*, turma_professor(professor_id, usuarios(nome))')
      .order('nome')
    setTurmas(data || [])
  }

  async function buscarProfessores() {
    const { data } = await supabase
      .from('usuarios')
      .select('id, nome')
      .eq('tipo', 'professor')
      .order('nome')
    setProfessores(data || [])
  }

  useEffect(() => {
    buscarTurmas()
    buscarProfessores()
  }, [])

  async function cadastrarTurma() {
    setErro('')
    if (!nome || !anoSerie) {
      setErro('Preencha todos os campos')
      return
    }

    setCarregando(true)
    const { error } = await supabase
      .from('turmas')
      .insert({ nome, ano_serie: anoSerie })

    if (error) {
      setErro('Erro ao cadastrar turma')
    } else {
      setNome('')
      setAnoSerie('')
      buscarTurmas()
    }
    setCarregando(false)
  }

  async function vincularProfessor(turmaId) {
    const profId = professorSelecionado[turmaId]
    if (!profId) return

    const { error } = await supabase
      .from('turma_professor')
      .insert({ turma_id: turmaId, professor_id: profId })

    if (error) {
      alert('Erro ao vincular professor')
    } else {
      setProfessorSelecionado({ ...professorSelecionado, [turmaId]: '' })
      buscarTurmas()
    }
  }

  async function desvincularProfessor(turmaId, profId) {
    await supabase
      .from('turma_professor')
      .delete()
      .eq('turma_id', turmaId)
      .eq('professor_id', profId)
    buscarTurmas()
  }

  async function apagarTurma(id) {
    await supabase.from('turmas').delete().eq('id', id)
    buscarTurmas()
  }

  return (
    <div style={{ display: 'flex' }}>
      <MenuAdmin />
      <div style={{ padding: '20px' }}>
        <h1>Turmas</h1>

        <h2>Cadastrar nova turma</h2>
        <input
          placeholder="Nome da turma (ex: 1904)"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <input
          placeholder="Ano/Serie (ex: 9 ano)"
          value={anoSerie}
          onChange={(e) => setAnoSerie(e.target.value)}
        />
        <button onClick={cadastrarTurma} disabled={carregando}>
          {carregando ? 'Salvando...' : 'Cadastrar'}
        </button>
        {erro && <p style={{ color: 'red' }}>{erro}</p>}

        <h2>Turmas cadastradas</h2>
        {turmas.length === 0 && <p>Nenhuma turma cadastrada ainda.</p>}
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Ano/Serie</th>
              <th>Professores</th>
              <th>Vincular Professor</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {turmas.map((turma) => (
              <tr key={turma.id}>
                <td>{turma.nome}</td>
                <td>{turma.ano_serie}</td>
                <td>
                  {turma.turma_professor?.map(tp => (
                    <div key={tp.professor_id}>
                      {tp.usuarios?.nome}
                      <button onClick={() => desvincularProfessor(turma.id, tp.professor_id)}>
                        Remover
                      </button>
                    </div>
                  ))}
                  {turma.turma_professor?.length === 0 && <span>Sem professor</span>}
                </td>
                <td>
                  <select
                    value={professorSelecionado[turma.id] || ''}
                    onChange={(e) => setProfessorSelecionado({ ...professorSelecionado, [turma.id]: e.target.value })}
                  >
                    <option value="">Selecione</option>
                    {professores.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                  <button onClick={() => vincularProfessor(turma.id)}>Vincular</button>
                </td>
                <td>
                  <button onClick={() => apagarTurma(turma.id)}>Apagar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}