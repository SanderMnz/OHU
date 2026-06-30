import { useEffect, useState } from 'react'
import MenuAdmin from '../../components/MenuAdmin'
import Layout from '../../components/Layout'
import { Titulo, Subtitulo, Botao, Input, Select, Tabela, Erro } from '../../components/UI'
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
    const { data } = await supabase.from('turmas').select('*').order('nome')
    setTurmas(data || [])
  }

  useEffect(() => {
    buscarProfessores()
    buscarTurmas()
  }, [])

  async function cadastrarProfessor() {
    setErro('')
    if (!nome || !username || !senha) { setErro('Preencha todos os campos'); return }
    setCarregando(true)
    const email = `${username}@ohu.app`
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({ email, password: senha, email_confirm: true })
    if (authError) { setErro('Erro ao cadastrar: ' + authError.message); setCarregando(false); return }
    await supabase.from('usuarios').insert({ id: authData.user.id, nome, email, username, tipo: 'professor' })
    if (turmaSelecionada) await supabase.from('turma_professor').insert({ turma_id: turmaSelecionada, professor_id: authData.user.id })
    setNome(''); setUsername(''); setSenha(''); setTurmaSelecionada('')
    buscarProfessores()
    setCarregando(false)
  }

  async function apagarProfessor(id) {
    await supabase.from('usuarios').delete().eq('id', id)
    buscarProfessores()
  }

  return (
    <Layout menu={<MenuAdmin />}>
      <Titulo>Professores</Titulo>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <Subtitulo>Cadastrar novo professor</Subtitulo>
        <div className="flex gap-3 flex-wrap">
          <Input placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} />
          <Input placeholder="Nome de usuário (ex: profjoao)" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))} />
          <Input placeholder="Senha inicial" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
          <Select value={turmaSelecionada} onChange={(e) => setTurmaSelecionada(e.target.value)}>
            <option value="">Turma (opcional)</option>
            {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </Select>
          <Botao onClick={cadastrarProfessor} disabled={carregando}>
            {carregando ? 'Salvando...' : 'Cadastrar'}
          </Botao>
        </div>
        <Erro>{erro}</Erro>
      </div>

      <Subtitulo>Professores cadastrados</Subtitulo>
      {professores.length === 0 && <p className="text-gray-400">Nenhum professor cadastrado ainda.</p>}
      <Tabela cabecalho={['Nome', 'Usuário', 'Turmas', 'Ações']}>
        {professores.map(prof => (
          <tr key={prof.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-medium">{prof.nome}</td>
            <td className="px-4 py-3 text-gray-500">{prof.username}</td>
            <td className="px-4 py-3">
              {prof.turma_professor?.length > 0
                ? prof.turma_professor.map(tp => tp.turmas?.nome).join(', ')
                : <span className="text-gray-400">Sem turma</span>}
            </td>
            <td className="px-4 py-3">
              <Botao onClick={() => apagarProfessor(prof.id)} variante="danger">Apagar</Botao>
            </td>
          </tr>
        ))}
      </Tabela>
    </Layout>
  )
}