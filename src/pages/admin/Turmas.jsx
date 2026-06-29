import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MenuAdmin from '../../components/MenuAdmin'
import Layout from '../../components/Layout'
import { Titulo, Subtitulo, Botao, Input, Select, Tabela, Erro } from '../../components/UI'
import { supabase } from '../../lib/supabase'

export default function Turmas() {
  const navigate = useNavigate()
  const [turmas, setTurmas] = useState([])
  const [professores, setProfessores] = useState([])
  const [nome, setNome] = useState('')
  const [anoSerie, setAnoSerie] = useState('')
  const [tipo, setTipo] = useState('diurno')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
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
    if (!nome || !anoSerie) { setErro('Preencha todos os campos'); return }
    setCarregando(true)
    const { error } = await supabase.from('turmas').insert({ nome, ano_serie: anoSerie, tipo, periodo_ativo: 1 })
    if (error) { setErro('Erro ao cadastrar turma') } else { setNome(''); setAnoSerie(''); setTipo('diurno'); buscarTurmas() }
    setCarregando(false)
  }

  async function avancarPeriodo(turma) {
    const maximo = turma.tipo === 'eja' ? 3 : 4
    if (turma.periodo_ativo >= maximo) { alert('Ja esta no ultimo periodo!'); return }
    await supabase.from('turmas').update({ periodo_ativo: turma.periodo_ativo + 1 }).eq('id', turma.id)
    buscarTurmas()
  }

  async function retrocederPeriodo(turma) {
    if (turma.periodo_ativo <= 1) { alert('Ja esta no primeiro periodo!'); return }
    await supabase.from('turmas').update({ periodo_ativo: turma.periodo_ativo - 1 }).eq('id', turma.id)
    buscarTurmas()
  }

  async function vincularProfessor(turmaId) {
    const profId = professorSelecionado[turmaId]
    if (!profId) return
    const { error } = await supabase.from('turma_professor').insert({ turma_id: turmaId, professor_id: profId })
    if (error) { alert('Erro ao vincular professor') } else { setProfessorSelecionado({ ...professorSelecionado, [turmaId]: '' }); buscarTurmas() }
  }

  async function desvincularProfessor(turmaId, profId) {
    await supabase.from('turma_professor').delete().eq('turma_id', turmaId).eq('professor_id', profId)
    buscarTurmas()
  }

  async function apagarTurma(id) {
    await supabase.from('turmas').delete().eq('id', id)
    buscarTurmas()
  }

  function labelPeriodo(turma) {
    const tipo = turma.tipo === 'eja' ? 'Trimestre' : 'Bimestre'
    return `${turma.periodo_ativo}º ${tipo}`
  }

  return (
    <Layout menu={<MenuAdmin />}>
      <Titulo>Turmas</Titulo>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <Subtitulo>Cadastrar nova turma</Subtitulo>
        <div className="flex gap-3 flex-wrap">
          <Input placeholder="Nome (ex: 1904)" value={nome} onChange={(e) => setNome(e.target.value)} />
          <Input placeholder="Ano/Serie (ex: 9 ano)" value={anoSerie} onChange={(e) => setAnoSerie(e.target.value)} />
          <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="diurno">Diurno (4 bimestres)</option>
            <option value="eja">EJA (3 trimestres)</option>
          </Select>
          <Botao onClick={cadastrarTurma} disabled={carregando}>
            {carregando ? 'Salvando...' : 'Cadastrar'}
          </Botao>
        </div>
        <Erro>{erro}</Erro>
      </div>

      <Subtitulo>Turmas cadastradas</Subtitulo>
      {turmas.length === 0 && <p className="text-gray-400">Nenhuma turma cadastrada ainda.</p>}

      <Tabela cabecalho={['Nome', 'Ano/Serie', 'Tipo', 'Periodo Ativo', 'Professores', 'Vincular Professor', 'Acoes']}>
        {turmas.map((turma) => (
          <tr key={turma.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-medium">{turma.nome}</td>
            <td className="px-4 py-3">{turma.ano_serie}</td>
            <td className="px-4 py-3">{turma.tipo === 'eja' ? 'EJA' : 'Diurno'}</td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <button onClick={() => retrocederPeriodo(turma)} className="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 font-bold">←</button>
                <span className="text-sm font-medium">{labelPeriodo(turma)}</span>
                <button onClick={() => avancarPeriodo(turma)} className="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 font-bold">→</button>
              </div>
            </td>
            <td className="px-4 py-3">
              {turma.turma_professor?.map(tp => (
                <div key={tp.professor_id} className="flex items-center gap-2">
                  <span className="text-sm">{tp.usuarios?.nome}</span>
                  <button onClick={() => desvincularProfessor(turma.id, tp.professor_id)} className="text-xs text-red-500 hover:text-red-700">Remover</button>
                </div>
              ))}
              {turma.turma_professor?.length === 0 && <span className="text-gray-400 text-sm">Sem professor</span>}
            </td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <Select
                  value={professorSelecionado[turma.id] || ''}
                  onChange={(e) => setProfessorSelecionado({ ...professorSelecionado, [turma.id]: e.target.value })}
                  className="text-sm"
                >
                  <option value="">Selecione</option>
                  {professores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </Select>
                <Botao onClick={() => vincularProfessor(turma.id)}>Vincular</Botao>
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <Botao onClick={() => navigate(`/admin/turmas/${turma.id}/conteudos`)} variante="secondary">Conteudos</Botao>
                <Botao onClick={() => apagarTurma(turma.id)} variante="danger">Apagar</Botao>
              </div>
            </td>
          </tr>
        ))}
      </Tabela>
    </Layout>
  )
}