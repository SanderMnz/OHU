import { useEffect, useState } from 'react'
import MenuAdmin from '../../components/MenuAdmin'
import Layout from '../../components/Layout'
import { Titulo, Subtitulo, Botao, Input, Tabela, Erro } from '../../components/UI'
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
    const { data } = await supabase.from('turmas').select('*').order('nome')
    setTurmas(data || [])
  }

  async function buscarAlunos(turmaId) {
    const { data } = await supabase.from('turma_aluno').select('usuarios(id, nome, username)').eq('turma_id', turmaId)
    setAlunos(data?.map(a => a.usuarios) || [])
  }

  useEffect(() => { buscarTurmas() }, [])

  async function selecionarTurma(turma) {
    setTurmaSelecionada(turma)
    setTurmaCadastro(turma.id)
    buscarAlunos(turma.id)
  }

  async function cadastrarAluno() {
    setErro('')
    if (!nome || !username || !senha || !turmaCadastro) { setErro('Preencha todos os campos'); return }
    setCarregando(true)
    const email = `${username}@ohu.app`
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({ email, password: senha, email_confirm: true })
    if (authError) { setErro('Erro ao cadastrar: ' + authError.message); setCarregando(false); return }
    await supabase.from('usuarios').insert({ id: authData.user.id, nome, email, username, tipo: 'aluno' })
    await supabase.from('turma_aluno').insert({ turma_id: turmaCadastro, aluno_id: authData.user.id })
    setNome(''); setUsername(''); setSenha('')
    buscarAlunos(turmaCadastro)
    setCarregando(false)
  }

  async function importarCSV(e) {
    const arquivo = e.target.files[0]
    if (!arquivo || !turmaCadastro) { setErro('Selecione uma turma antes de importar'); return }
    setImportando(true); setResultadoImport(''); setErro('')
    const texto = await arquivo.text()
    const linhas = texto.split('\n').filter(l => l.trim())
    const dados = linhas.slice(1)
    let sucesso = 0, falha = 0, erros = []
    for (const linha of dados) {
      const colunas = linha.split(',').map(c => c.trim().replace(/"/g, ''))
      const [p_nome, p_username, p_senha] = colunas
      if (!p_nome || !p_username || !p_senha) { falha++; continue }
      const email = `${p_username.toLowerCase().replace(/\s/g, '')}@ohu.app`
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({ email, password: p_senha, email_confirm: true })
      if (authError) { falha++; erros.push(`Erro em ${p_nome}: ${authError.message}`); continue }
      await supabase.from('usuarios').insert({ id: authData.user.id, nome: p_nome, email, username: p_username.toLowerCase().replace(/\s/g, ''), tipo: 'aluno' })
      await supabase.from('turma_aluno').insert({ turma_id: turmaCadastro, aluno_id: authData.user.id })
      sucesso++
    }
    setResultadoImport(`Concluído: ${sucesso} cadastrados, ${falha} com erro. ${erros.join(' | ')}`)
    buscarAlunos(turmaCadastro)
    setImportando(false)
  }

  async function apagarAluno(id) {
    await supabase.from('usuarios').delete().eq('id', id)
    buscarAlunos(turmaSelecionada.id)
  }

  return (
    <Layout menu={<MenuAdmin />}>
      <Titulo>Alunos</Titulo>
      <div className="flex gap-6">
        <div className="w-48 shrink-0">
          <Subtitulo>Turmas</Subtitulo>
          <div className="space-y-1">
            {turmas.map(t => (
              <div
                key={t.id}
                onClick={() => selecionarTurma(t)}
                className={`px-4 py-2 rounded-lg cursor-pointer transition ${turmaSelecionada?.id === t.id ? 'bg-blue-600 text-white font-semibold' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}
              >
                {t.nome}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1">
          {!turmaSelecionada && <p className="text-gray-400">Selecione uma turma ao lado.</p>}
          {turmaSelecionada && (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <Subtitulo>Cadastrar aluno na turma {turmaSelecionada.nome}</Subtitulo>
                <div className="flex gap-3 flex-wrap">
                  <Input placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} />
                  <Input placeholder="Nome de usuário" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))} />
                  <Input placeholder="Senha inicial" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
                  <Botao onClick={cadastrarAluno} disabled={carregando}>{carregando ? 'Salvando...' : 'Cadastrar'}</Botao>
                </div>
                <Erro>{erro}</Erro>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-2">Importar por CSV — colunas: nome, username, senha</p>
                  <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition">
                           {importando ? 'Importando...' : '📂 Importar CSV'}
                      <input type="file" accept=".csv" onChange={importarCSV} disabled={importando} className="hidden" />
                  </label>
                  {importando && <p className="text-sm text-blue-500 mt-1">Importando...</p>}
                  {resultadoImport && <p className="text-sm text-green-600 mt-1">{resultadoImport}</p>}
                </div>
              </div>

              <Subtitulo>Alunos cadastrados ({alunos.length})</Subtitulo>
              {alunos.length === 0 && <p className="text-gray-400">Nenhum aluno nesta turma ainda.</p>}
              <Tabela cabecalho={['Nome', 'Usuário', 'Ações']}>
                {alunos.map(aluno => (
                  <tr key={aluno.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{aluno.nome}</td>
                    <td className="px-4 py-3 text-gray-500">{aluno.username}</td>
                    <td className="px-4 py-3">
                      <Botao onClick={() => apagarAluno(aluno.id)} variante="danger">Apagar</Botao>
                    </td>
                  </tr>
                ))}
              </Tabela>
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}