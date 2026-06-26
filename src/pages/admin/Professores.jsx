import { useEffect, useState } from 'react'
import MenuAdmin from '../../components/MenuAdmin'
import { supabase } from '../../lib/supabase'

export default function Professores() {
  const [professores, setProfessores] = useState([])
  const [turmas, setTurmas] = useState([])
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
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
    if (!nome || !email || !senha) {
      setErro('Preencha todos os campos obrigatórios')
      return
    }

    setCarregando(true)

    const { error } = await supabase.rpc('criar_professor', {
      p_email: email,
      p_senha: senha,
      p_nome: nome,
      p_turma_id: turmaSelecionada || null
    })

    if (error) {
      setErro('Erro ao cadastrar professor: ' + error.message)
    } else {
      setNome('')
      setEmail('')
      setSenha('')
      setTurmaSelecionada('')
      buscarProfessores()
    }

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
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
        {erro && <p>{erro}</p>}

        <h2>Professores cadastrados</h2>
        {professores.length === 0 && <p>Nenhum professor cadastrado ainda.</p>}
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Turma</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {professores.map((prof) => (
              <tr key={prof.id}>
                <td>{prof.nome}</td>
                <td>{prof.email}</td>
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