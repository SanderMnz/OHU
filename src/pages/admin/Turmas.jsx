import { useEffect, useState } from 'react'
import MenuAdmin from '../../components/MenuAdmin'
import { supabase } from '../../lib/supabase'

export default function Turmas() {
  const [turmas, setTurmas] = useState([])
  const [nome, setNome] = useState('')
  const [anoSerie, setAnoSerie] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    buscarTurmas()
  }, [])

  async function buscarTurmas() {
    const { data } = await supabase
      .from('turmas')
      .select('*')
      .order('nome')
    setTurmas(data || [])
  }

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
          placeholder="Ano/Série (ex: 9º ano)"
          value={anoSerie}
          onChange={(e) => setAnoSerie(e.target.value)}
        />
        <button onClick={cadastrarTurma} disabled={carregando}>
          {carregando ? 'Salvando...' : 'Cadastrar'}
        </button>
        {erro && <p>{erro}</p>}

        <h2>Turmas cadastradas</h2>
        {turmas.length === 0 && <p>Nenhuma turma cadastrada ainda.</p>}
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Ano/Série</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {turmas.map((turma) => (
              <tr key={turma.id}>
                <td>{turma.nome}</td>
                <td>{turma.ano_serie}</td>
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