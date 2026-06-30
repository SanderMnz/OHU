import { useEffect, useState } from 'react'
import MenuProfessor from '../../components/MenuProfessor'
import Layout from '../../components/Layout'
import { Titulo, Botao, Input, Select, Tabela } from '../../components/UI'
import { supabase } from '../../lib/supabase'

export default function ProfessorNotas() {
  const [turmas, setTurmas] = useState([])
  const [turmaSelecionada, setTurmaSelecionada] = useState(null)
  const [aba, setAba] = useState('provas')

  useEffect(() => { buscarTurmas() }, [])

  async function buscarTurmas() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase.from('turma_professor').select('turmas(*)').eq('professor_id', session.user.id)
    setTurmas(data?.map(t => t.turmas) || [])
  }

  function labelPeriodo(turma) {
    if (!turma) return ''
    const tipo = turma.tipo === 'eja' ? 'Trimestre' : 'Bimestre'
    return `${turma.periodo_ativo}º ${tipo}`
  }

  const abas = [
    { id: 'provas', label: 'Provas' },
    { id: 'adr', label: 'ADR' },
    { id: 'miniteste', label: 'Miniteste' },
    { id: 'participacao', label: 'Participação' },
  ]

  return (
    <Layout menu={<MenuProfessor />}>
      <Titulo>Lançamento de Notas</Titulo>

      <div className="flex items-center gap-4 mb-6">
        <Select
          value={turmaSelecionada?.id || ''}
          onChange={(e) => { const turma = turmas.find(t => t.id === e.target.value); setTurmaSelecionada(turma || null) }}
        >
          <option value="">Selecione a turma</option>
          {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </Select>
        {turmaSelecionada && (
          <span className="text-blue-600 font-semibold">Período ativo: {labelPeriodo(turmaSelecionada)}</span>
        )}
      </div>

      {turmaSelecionada && (
        <div>
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {abas.map(a => (
              <button
                key={a.id}
                onClick={() => setAba(a.id)}
                className={`px-4 py-2 font-medium text-sm transition border-b-2 ${aba === a.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {a.label}
              </button>
            ))}
          </div>

          {aba === 'provas' && <AbaProvas turma={turmaSelecionada} />}
          {aba === 'adr' && <AbaAdr turma={turmaSelecionada} />}
          {aba === 'miniteste' && <AbaPresenca turma={turmaSelecionada} tipo="miniteste" />}
          {aba === 'participacao' && <AbaPresenca turma={turmaSelecionada} tipo="participacao" />}
        </div>
      )}
    </Layout>
  )
}

function AbaProvas({ turma }) {
  const [provas, setProvas] = useState([])
  const [alunos, setAlunos] = useState([])
  const [nomeProva, setNomeProva] = useState('')
  const [dataProva, setDataProva] = useState('')
  const [provaSelecionada, setProvaSelecionada] = useState('')
  const [notas, setNotas] = useState({})
  const [editandoProva, setEditandoProva] = useState(null)
  const [nomeEditado, setNomeEditado] = useState('')

  useEffect(() => { buscarProvas(); buscarAlunos() }, [turma])

  async function buscarProvas() {
    const { data } = await supabase.from('provas').select('*').eq('turma_id', turma.id).eq('bimestre', turma.periodo_ativo).order('criado_em')
    setProvas(data || [])
  }

  async function buscarAlunos() {
    const { data } = await supabase.from('turma_aluno').select('usuarios(id, nome)').eq('turma_id', turma.id)
    setAlunos(data?.map(a => a.usuarios) || [])
  }

  async function criarProva() {
    if (!nomeProva) return
    await supabase.from('provas').insert({ turma_id: turma.id, nome: nomeProva, bimestre: turma.periodo_ativo, data: dataProva || null })
    setNomeProva(''); setDataProva('')
    buscarProvas()
  }

  async function editarProva(prova) { setEditandoProva(prova.id); setNomeEditado(prova.nome) }

  async function salvarEdicaoProva(provaId) {
    if (!nomeEditado) return
    await supabase.from('provas').update({ nome: nomeEditado }).eq('id', provaId)
    setEditandoProva(null); setNomeEditado('')
    buscarProvas()
  }

  async function excluirProva(provaId) {
    if (!confirm('Excluir esta prova e todas as notas?')) return
    await supabase.from('notas_prova').delete().eq('prova_id', provaId)
    await supabase.from('provas').delete().eq('id', provaId)
    setProvaSelecionada('')
    buscarProvas()
  }

  async function buscarNotas(provaId) {
    setProvaSelecionada(provaId)
    const { data } = await supabase.from('notas_prova').select('*').eq('prova_id', provaId)
    const notasMap = {}
    data?.forEach(n => { notasMap[n.aluno_id] = n.nota })
    setNotas(notasMap)
  }

  async function salvarNotas() {
    for (const aluno of alunos) {
      const nota = parseFloat(notas[aluno.id])
      if (isNaN(nota)) continue
      const { data: existing } = await supabase.from('notas_prova').select('id').eq('prova_id', provaSelecionada).eq('aluno_id', aluno.id).maybeSingle()
      if (existing) { await supabase.from('notas_prova').update({ nota }).eq('id', existing.id) }
      else { await supabase.from('notas_prova').insert({ prova_id: provaSelecionada, aluno_id: aluno.id, nota }) }
    }
    alert('Notas salvas!')
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Criar nova prova</h3>
        <div className="flex gap-3">
          <Input placeholder="Nome da prova" value={nomeProva} onChange={(e) => setNomeProva(e.target.value)} />
          <input type="date" value={dataProva} onChange={(e) => setDataProva(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2" />
          <Botao onClick={criarProva}>Criar prova</Botao>
        </div>
      </div>

      {provas.length > 0 && (
        <Tabela cabecalho={['Nome', 'Data', 'Ações']}>
          {provas.map(p => (
            <tr key={p.id} className={provaSelecionada === p.id ? 'bg-blue-50' : 'hover:bg-gray-50'}>
              <td className="px-4 py-3">
                {editandoProva === p.id ? (
                  <Input value={nomeEditado} onChange={(e) => setNomeEditado(e.target.value)} />
                ) : <span className="font-medium">{p.nome}</span>}
              </td>
              <td className="px-4 py-3 text-gray-500">{p.data ? new Date(p.data).toLocaleDateString('pt-BR') : '-'}</td>
              <td className="px-4 py-3">
                {editandoProva === p.id ? (
                  <div className="flex gap-2">
                    <Botao onClick={() => salvarEdicaoProva(p.id)} variante="success">Salvar</Botao>
                    <Botao onClick={() => setEditandoProva(null)} variante="secondary">Cancelar</Botao>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Botao onClick={() => buscarNotas(p.id)}>Lancar notas</Botao>
                    <Botao onClick={() => editarProva(p)} variante="secondary">Editar</Botao>
                    <Botao onClick={() => excluirProva(p.id)} variante="danger">Excluir</Botao>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </Tabela>
      )}

      {provaSelecionada && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-700 mb-3">Lançamento de notas: {provas.find(p => p.id === provaSelecionada)?.nome}</h3>
          <Tabela cabecalho={['Aluno', 'Nota (0-10)']}>
            {alunos.map(aluno => (
              <tr key={aluno.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{aluno.nome}</td>
                <td className="px-4 py-3">
                  <input
                    type="number" min="0" max="10" step="0.1"
                    value={notas[aluno.id] || ''}
                    onChange={(e) => setNotas({ ...notas, [aluno.id]: e.target.value })}
                    className="w-20 border border-gray-300 rounded-lg px-2 py-1"
                  />
                </td>
              </tr>
            ))}
          </Tabela>
          <div className="mt-3">
            <Botao onClick={salvarNotas}>Salvar notas</Botao>
          </div>
        </div>
      )}
    </div>
  )
}

function AbaAdr({ turma }) {
  const [alunos, setAlunos] = useState([])
  const [notas, setNotas] = useState({})

  useEffect(() => { buscarAlunos() }, [turma])

  async function buscarAlunos() {
    const { data } = await supabase.from('turma_aluno').select('usuarios(id, nome)').eq('turma_id', turma.id)
    const lista = data?.map(a => a.usuarios) || []
    setAlunos(lista)
    const { data: notasData } = await supabase.from('notas_adr').select('*').eq('turma_id', turma.id).eq('bimestre', turma.periodo_ativo)
    const notasMap = {}
    notasData?.forEach(n => { notasMap[n.aluno_id] = n.nota })
    setNotas(notasMap)
  }

  async function salvarNotas() {
    for (const aluno of alunos) {
      const nota = parseFloat(notas[aluno.id])
      if (isNaN(nota)) continue
      const { data: existing } = await supabase.from('notas_adr').select('id').eq('aluno_id', aluno.id).eq('turma_id', turma.id).eq('bimestre', turma.periodo_ativo).maybeSingle()
      if (existing) { await supabase.from('notas_adr').update({ nota }).eq('id', existing.id) }
      else { await supabase.from('notas_adr').insert({ aluno_id: aluno.id, turma_id: turma.id, bimestre: turma.periodo_ativo, nota }) }
    }
    alert('Notas ADR salvas!')
  }

  return (
    <div>
      <Tabela cabecalho={['Aluno', 'Nota ADR (0-10)']}>
        {alunos.map(aluno => (
          <tr key={aluno.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-medium">{aluno.nome}</td>
            <td className="px-4 py-3">
              <input
                type="number" min="0" max="10" step="0.1"
                value={notas[aluno.id] || ''}
                onChange={(e) => setNotas({ ...notas, [aluno.id]: e.target.value })}
                className="w-20 border border-gray-300 rounded-lg px-2 py-1"
              />
            </td>
          </tr>
        ))}
      </Tabela>
      <div className="mt-3">
        <Botao onClick={salvarNotas}>Salvar notas ADR</Botao>
      </div>
    </div>
  )
}

function AbaPresenca({ turma, tipo }) {
  const [alunos, setAlunos] = useState([])
  const [descricao, setDescricao] = useState('')
  const [presencas, setPresencas] = useState({})
  const [registros, setRegistros] = useState([])

  useEffect(() => { buscarAlunos(); buscarRegistros() }, [turma, tipo])

  async function buscarAlunos() {
    const { data } = await supabase.from('turma_aluno').select('usuarios(id, nome)').eq('turma_id', turma.id)
    setAlunos(data?.map(a => a.usuarios) || [])
  }

  async function buscarRegistros() {
    const tabela = tipo === 'miniteste' ? 'registros_miniteste' : 'registros_participacao'
    const { data } = await supabase.from(tabela).select('*').eq('turma_id', turma.id).eq('bimestre', turma.periodo_ativo).order('data', { ascending: true })
    setRegistros(data || [])
  }

  async function salvarPresenca() {
    if (!descricao) return
    const tabela = tipo === 'miniteste' ? 'registros_miniteste' : 'registros_participacao'
    const campo = tipo === 'miniteste' ? 'presente' : 'participou'
    for (const aluno of alunos) {
      await supabase.from(tabela).insert({ aluno_id: aluno.id, turma_id: turma.id, bimestre: turma.periodo_ativo, descricao, [campo]: presencas[aluno.id] || false })
    }
    setDescricao(''); setPresencas({})
    buscarRegistros()
    alert('Presença registrada!')
  }

  const titulo = tipo === 'miniteste' ? 'Miniteste' : 'Participacao'
  const campo = tipo === 'miniteste' ? 'presente' : 'participou'

  const eventos = []
  const eventosVistos = new Set()
  registros.forEach(r => {
    const chave = `${r.descricao}__${new Date(r.data).toLocaleDateString('pt-BR')}`
    if (!eventosVistos.has(chave)) { eventosVistos.add(chave); eventos.push({ descricao: r.descricao, data: new Date(r.data).toLocaleDateString('pt-BR') }) }
  })

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Registrar {titulo}</h3>
        <div className="flex gap-3">
          <Input placeholder="Descrição (ex: Miniteste 1 - Equações)" value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-96" />
          <Botao onClick={salvarPresenca}>Registrar</Botao>
        </div>

        <Tabela cabecalho={['Aluno', 'Presente']}>
          {alunos.map(aluno => (
            <tr key={aluno.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">{aluno.nome}</td>
              <td className="px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={presencas[aluno.id] || false}
                  onChange={(e) => setPresencas({ ...presencas, [aluno.id]: e.target.checked })}
                  className="w-4 h-4"
                />
              </td>
            </tr>
          ))}
        </Tabela>
      </div>

      {eventos.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Aluno</th>
                {eventos.map((e, i) => <th key={i} className="px-4 py-3 text-center">{e.descricao}<br /><span className="font-normal normal-case">{e.data}</span></th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {alunos.map(aluno => (
                <tr key={aluno.id}>
                  <td className="px-4 py-3 font-medium">{aluno.nome}</td>
                  {eventos.map((evento, i) => {
                    const reg = registros.find(r => r.aluno_id === aluno.id && r.descricao === evento.descricao && new Date(r.data).toLocaleDateString('pt-BR') === evento.data)
                    return <td key={i} className="px-4 py-3 text-center">{reg ? (reg[campo] ? '✅' : '❌') : '-'}</td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}