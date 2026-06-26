import { useEffect, useState } from 'react'
import MenuAdmin from '../../components/MenuAdmin'
import { supabase, supabaseAdmin } from '../../lib/supabase'

export default function Alunos() {
  const [alunos, setAlunos] = useState([])
  const [turmas, setTurmas] = useState([])
  const [nome, setNome] = useState('')
  const [username, setUsername] = useState('')
  const [senha, setSenha] = useState('')
  const [turmaSelecionada, setTurmaSelecionada] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [importando, setImportando] = useState(false)
  const [resultadoImport, setResultadoImport] = useState('')

  async function buscarAlunos() {
    const { data } = await supabase
      .from('usuarios')
      .select('*, turma_aluno(turma_id, turmas(nome))')
      .eq('tipo', 'aluno')
      .order('nome')
    setAlunos(data || [])
  }

  async function buscarTurmas() {
    const { data } = await supabase
      .from('turmas')
      .select('*')
      .order('nome')
    setTurmas(data || [])
  }

  useEffect(() => {
    buscarAlunos()
    buscarTurmas()
  }, [])

  async function cadastrarAluno() {
    setErro('')
    if (!nome || !username || !senha || !turmaSelecionada) {
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
      tipo: 'aluno'
    })

    await supabase.from('turma_aluno').insert({
      turma_id: turmaSelecionada,
      aluno_id: authData.user.id
    })

    setNome('')
    setUsername('')
    setSenha('')
    setTurmaSelecionada('')
    buscarAlunos()
    setCarregando(false)
  }

  async function importarCSV(e) {
    const arquivo = e.target.files[0]
    if (!arquivo || !turmaSelecionada) {
      setErro('Selecione uma turma antes de importar')
      return
    }

    setImportando(true)
    setResultadoImport('')
    setErro('')

    const texto = await arquivo.text()
    const linhas = texto.split('\n').filter(l => l.trim())
    const dados = linhas.slice(1)

    let sucesso = 0
    let falha = 0
    let erros = []

    for (const linha of dados) {
      const colunas = linha.split(',').map(c => c.trim().replace(/"/g, ''))
      const [p_nome, p_username, p_senha] = colunas

      if (!p_nome || !p_username || !p_senha) {
        falha++
        continue
      }

      const email = `${p_username.toLowerCase().replace(/\s/g, '')}@ohu.app`

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: p_senha,
        email_confirm: true
      })

      if (authError) {
        falha++
        erros.push(`Erro em ${p_nome}: ${authError.message}`)
        continue
      }

      await supabase.from('usuarios').insert({
        id: authData.user.id,
        nome: p_nome,
        email,
        username: p_username.toLowerCase().replace(/\s/g, ''),
        tipo: 'aluno'
      })

      await supabase.from('turma_aluno').insert({
        turma_id: turmaSelecionada,
        aluno_id: authData.user.id
      })

      sucesso++
    }

    setResultadoImport(`Concluído: ${sucesso} cadastrados, ${falha} com erro. ${erros.join(' | ')}`)
    buscarAlunos()
    setImportando(false)
  }

  async function apagarAluno(id) {
    await supabase.from('usuarios').delete().eq('id', id)
    buscarAlunos()
  }

  return (
    <div style={{ display: 'flex' }}>
      <MenuAdmin />
      <div style={{ padding: '20px' }}>
        <h1>Alunos</h1>

        <h2>Cadastrar novo aluno</h2>
        <input
          placeholder="Nome completo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <input
          placeholder="Nome de usuário (ex: joaosilva)"
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
          <option value="">Selecione uma turma</option>
          {turmas.map((turma) => (
            <option key={turma.id} value={turma.id}>{turma.nome}</option>
          ))}
        </select>
        <button onClick={cadastrarAluno} disabled={carregando}>
          {carregando ? 'Salvando...' : 'Cadastrar'}
        </button>
        {erro && <p style={{ color: 'red' }}>{erro}</p>}

        <hr />

        <h2>Importar alunos por CSV</h2>
        <p>O arquivo deve ter as colunas: <strong>nome, username, senha</strong></p>
        <p>Selecione a turma acima antes de importar.</p>
        <input
          type="file"
          accept=".csv"
          onChange={importarCSV}
          disabled={importando}
        />
        {importando && <p>Importando...</p>}
        {resultadoImport && <p>{resultadoImport}</p>}

        <hr />

        <h2>Alunos cadastrados</h2>
        {alunos.length === 0 && <p>Nenhum aluno cadastrado ainda.</p>}
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Usuário</th>
              <th>Turma</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {alunos.map((aluno) => (
              <tr key={aluno.id}>
                <td>{aluno.nome}</td>
                <td>{aluno.username}</td>
                <td>{aluno.turma_aluno?.[0]?.turmas?.nome || 'Sem turma'}</td>
                <td>
                  <button onClick={() => apagarAluno(aluno.id)}>Apagar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}