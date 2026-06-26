import { useEffect, useState } from 'react'
import MenuAdmin from '../../components/MenuAdmin'
import { supabase, supabaseAdmin } from '../../lib/supabase'

export default function Professores() {
  const [professores, setProfessores] = useState([])
  const [turmas, setTurmas] = useState([])
  const [nome, setNome] = useState('')
  const [username, setUsername] = useState('')
  const [senha, setSenha] = useState('')
  const [turmaSelecionada, setTurmaSelecionada] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function buscarProfessores() {
    const { data } = await supabase
      .from('usuarios')
      .select('*, turma_professor(turma_id, turmas(nome))')
      .eq('tipo', 'professor')
      .order('nome')
    setProfessores(data || [])
  }

  async function buscarTurmas() {
    const { data } = await supabase
      .from('turmas')
      .select('*')
      .order('nome')
    setTurmas(data || [])
  }

  useEffect(() => {
    buscarProfessores()
    buscarTurmas()
  }, [])

  async function cadastrarProfessor() {
    setErro('')
    if (!nome || !username || !senha) {
      setErro('Preencha todos os campos')
      return
    }

    setCarregando(true)

    const email = `${username}@ohu.app`

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true
    })

    if (authError) {
      setErro('Erro ao cadastrar: ' + authError.message)
      setCarregando(false)
      return
    }

    await supabase.from('usuarios').insert({
      id: authData.user.id,
      nome,
      email,
      username,
      tipo: 'professor'
    })

    if (turmaSelecionada) {
      await supabase.from('turma_professor').insert({
        turma_id: turmaSelecionada,
        professor_id: authData.user.id
      })
    }

    setNome('')
    setUsername('')
    setSenha('')
    setTurmaSelecionada('')
    buscarProfessores()
    setCarregando(false)
  }

  async function apagarProfessor(id) {
    await supabase.from('usuarios').delete().eq('id', id)
    buscarProfessores()
  }

  return (
    <div style={{ display: 'flex' }}>
      <MenuAdmin />
      <div style={{ padding: '20px' }}>
        <h1>Professores</h1>

        <h2>Cadastrar novo professor</h2>
        <input
          placeholder="Nome completo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <input
          placeholder="Nome de usuario (ex: profjoao)"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
        />
        <input
          placeholder="Senha inicial"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
        <select
          value={turmaSelecionada}
          onChange={(e) => setTurmaSelecionada(e.target.value)}
        >
          <option value="">Selecione uma turma (opcional)</option>
          {turmas.map((turma) => (
            <option key={turma.id} value={turma.id}>{turma.nome}</option>
          ))}
        </select>
        <button onClick={cadastrarProfessor} disabled={carregando}>
          {carregando ? 'Salvando...' : 'Cadastrar'}
        </button>
        {erro && <p style={{ color: 'red' }}>{erro}</p>}

        <h2>Professores cadastrados</h2>
        {professores.length === 0 && <p>Nenhum professor cadastrado ainda.</p>}
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Usuario</th>
              <th>Turma</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {professores.map((prof) => (
              <tr key={prof.id}>
                <td>{prof.nome}</td>
                <td>{prof.username}</td>
                <td>{prof.turma_professor?.[0]?.turmas?.nome || 'Sem turma'}</td>
                <td>
                  <button onClick={() => apagarProfessor(prof.id)}>Apagar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}