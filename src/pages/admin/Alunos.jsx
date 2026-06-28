import { useEffect, useState } from 'react'
import MenuAdmin from '../../components/MenuAdmin'
import { supabase, supabaseAdmin } from '../../lib/supabase'

export default function Alunos() {
  const [turmas, setTurmas] = useState([])
  const [turmaSelecionada, setTurmaSelecionada] = useState(null)
  const [alunos, setAlunos] = useState([])
  const [nome, setNome] = useState('')
  const [username, setUsername] = useState('')
  const [senha, setSenha] = useState('')
  const [turmaCadastro, setTurmaCadastro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [importando, setImportando] = useState(false)
  const [resultadoImport, setResultadoImport] = useState('')

  async function buscarTurmas() {
    const { data } = await supabase
      .from('turmas')
      .select('*')
      .order('nome')
    setTurmas(data || [])
  }

  async function buscarAlunos(turmaId) {
    const { data } = await supabase
      .from('turma_aluno')
      .select('usuarios(id, nome, username)')
      .eq('turma_id', turmaId)
    setAlunos(data?.map(a => a.usuarios) || [])
  }

  useEffect(() => {
    buscarTurmas()
  }, [])

  async function selecionarTurma(turma) {
    setTurmaSelecionada(turma)
    setTurmaCadastro(turma.id)
    buscarAlunos(turma.id)
  }

  async function cadastrarAluno() {
    setErro('')
    if (!nome || !username || !senha || !turmaCadastro) {
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
      turma_id: turmaCadastro,
      aluno_id: authData.user.id
    })

    setNome('')
    setUsername('')
    setSenha('')
    buscarAlunos(turmaCadastro)
    setCarregando(false)
  }

  async function importarCSV(e) {
    const arquivo = e.target.files[0]
    if (!arquivo || !turmaCadastro) {
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
        turma_id: turmaCadastro,
        aluno_id: authData.user.id
      })

      sucesso++
    }

    setResultadoImport(`Concluido: ${sucesso} cadastrados, ${falha} com erro. ${erros.join(' | ')}`)
    buscarAlunos(turmaCadastro)
    setImportando(false)
  }

  async function apagarAluno(id) {
    await supabase.from('usuarios').delete().eq('id', id)
    buscarAlunos(turmaSelecionada.id)
  }

  return (
    <div style={{ display: 'flex' }}>
      <MenuAdmin />
      <div style={{ padding: '20px' }}>
        <h1>Alunos</h1>

        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ minWidth: '200px', borderRight: '1px solid #ccc', paddingRight: '20px' }}>
            <h2>Turmas</h2>
            {turmas.map(t => (
              <div
                key={t.id}
                onClick={() => selecionarTurma(t)}
                style={{
                  padding: '10px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  marginBottom: '6px',
                  background: turmaSelecionada?.id === t.id ? '#e0e7ff' : '#f5f5f5',
                  fontWeight: turmaSelecionada?.id === t.id ? 'bold' : 'normal'
                }}
              >
                {t.nome}
              </div>
            ))}
          </div>

          <div style={{ flex: 1 }}>
            {!turmaSelecionada && <p>Selecione uma turma ao lado.</p>}

            {turmaSelecionada && (
              <>
                <h2>Turma {turmaSelecionada.nome}</h2>

                <h3>Cadastrar novo aluno</h3>
                <input
                  placeholder="Nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
                <input
                  placeholder="Nome de usuario (ex: joaosilva)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  style={{ marginLeft: '5px' }}
                />
                <input
                  placeholder="Senha inicial"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  style={{ marginLeft: '5px' }}
                />
                <button onClick={cadastrarAluno} disabled={carregando} style={{ marginLeft: '5px' }}>
                  {carregando ? 'Salvando...' : 'Cadastrar'}
                </button>
                {erro && <p style={{ color: 'red' }}>{erro}</p>}

                <hr />

                <h3>Importar por CSV</h3>
                <p style={{ color: 'gray', fontSize: '13px' }}>Colunas: nome, username, senha</p>
                <input type="file" accept=".csv" onChange={importarCSV} disabled={importando} />
                {importando && <p>Importando...</p>}
                {resultadoImport && <p>{resultadoImport}</p>}

                <hr />

                <h3>Alunos cadastrados ({alunos.length})</h3>
                {alunos.length === 0 && <p>Nenhum aluno nesta turma ainda.</p>}
                <table border="1" cellPadding="8">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Usuario</th>
                      <th>Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alunos.map(aluno => (
                      <tr key={aluno.id}>
                        <td>{aluno.nome}</td>
                        <td>{aluno.username}</td>
                        <td>
                          <button onClick={() => apagarAluno(aluno.id)}>Apagar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}