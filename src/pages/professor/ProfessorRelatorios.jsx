import { useEffect, useState } from 'react'
import MenuProfessor from '../../components/MenuProfessor'
import Layout from '../../components/Layout'
import { Titulo, Select } from '../../components/UI'
import { supabase } from '../../lib/supabase'

export default function ProfessorRelatorios() {
  const [turmas, setTurmas] = useState([])
  const [turmaSelecionada, setTurmaSelecionada] = useState(null)
  const [relatorio, setRelatorio] = useState([])
  const [provas, setProvas] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [editando, setEditando] = useState({})

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

  async function gerarRelatorio(turma) {
    if (!turma) return
    setCarregando(true)
    setRelatorio([])
    setEditando({})

    const { data: alunosData } = await supabase.from('turma_aluno').select('usuarios(id, nome)').eq('turma_id', turma.id)
    const alunos = alunosData?.map(a => a.usuarios) || []

    const { data: provasData } = await supabase.from('provas').select('*').eq('turma_id', turma.id).eq('bimestre', turma.periodo_ativo).order('criado_em')
    setProvas(provasData || [])

    const linhas = await Promise.all(alunos.map(async (aluno) => {
      const notasProva = {}
      for (const prova of provasData || []) {
        const { data } = await supabase.from('notas_prova').select('id, nota').eq('prova_id', prova.id).eq('aluno_id', aluno.id).maybeSingle()
        notasProva[prova.id] = { id: data?.id, nota: data?.nota ?? '' }
      }

      const { data: adrData } = await supabase.from('notas_adr').select('id, nota').eq('aluno_id', aluno.id).eq('turma_id', turma.id).eq('bimestre', turma.periodo_ativo).maybeSingle()

      const { data: miniData } = await supabase.from('registros_miniteste').select('presente').eq('aluno_id', aluno.id).eq('turma_id', turma.id).eq('bimestre', turma.periodo_ativo)
      const totalMini = miniData?.length || 0
      const presentesMini = miniData?.filter(r => r.presente).length || 0
      const notaMini = totalMini > 0 ? ((presentesMini / totalMini) * 10).toFixed(1) : null

      const { data: partData } = await supabase.from('registros_participacao').select('participou').eq('aluno_id', aluno.id).eq('turma_id', turma.id).eq('bimestre', turma.periodo_ativo)
      const totalPart = partData?.length || 0
      const participou = partData?.filter(r => r.participou).length || 0
      const notaPart = totalPart > 0 ? ((participou / totalPart) * 10).toFixed(1) : null

      const mediasProva = Object.values(notasProva).map(n => parseFloat(n.nota)).filter(n => !isNaN(n))
      const mediaGeral = mediasProva.length > 0 ? (mediasProva.reduce((a, b) => a + b, 0) / mediasProva.length).toFixed(1) : null

      return { aluno, notasProva, adr: { id: adrData?.id, nota: adrData?.nota ?? '' }, notaMini, notaPart, mediaGeral: parseFloat(mediaGeral) }
    }))

    setRelatorio(linhas)
    setCarregando(false)
  }

  async function salvarNota(alunoId, campo, provaId, valor) {
    if (valor === undefined || valor === '') return
    const nota = parseFloat(valor)
    if (isNaN(nota) || nota < 0 || nota > 10) { alert('Nota invalida. Digite um valor entre 0 e 10.'); return }

    if (provaId) {
      const linha = relatorio.find(r => r.aluno.id === alunoId)
      const existing = linha?.notasProva[provaId]
      if (existing?.id) { await supabase.from('notas_prova').update({ nota }).eq('id', existing.id) }
      else { await supabase.from('notas_prova').insert({ prova_id: provaId, aluno_id: alunoId, nota }) }
    } else if (campo === 'adr') {
      const linha = relatorio.find(r => r.aluno.id === alunoId)
      if (linha?.adr?.id) { await supabase.from('notas_adr').update({ nota }).eq('id', linha.adr.id) }
      else { await supabase.from('notas_adr').insert({ aluno_id: alunoId, turma_id: turmaSelecionada.id, bimestre: turmaSelecionada.periodo_ativo, nota }) }
    }

    gerarRelatorio(turmaSelecionada)
  }

  function calcularDestaques() {
    if (relatorio.length === 0) return null
    const comNota = relatorio.filter(r => !isNaN(r.mediaGeral))
    const top3 = [...comNota].sort((a, b) => b.mediaGeral - a.mediaGeral).slice(0, 3).map(r => r.aluno.id)
    const comMini = relatorio.filter(r => r.notaMini !== null)
    const melhorMini = comMini.length > 0 ? comMini.reduce((a, b) => parseFloat(a.notaMini) > parseFloat(b.notaMini) ? a : b) : null
    const comPart = relatorio.filter(r => r.notaPart !== null)
    const melhorPart = comPart.length > 0 ? comPart.reduce((a, b) => parseFloat(a.notaPart) > parseFloat(b.notaPart) ? a : b) : null
    return { top3, melhorMini, melhorPart }
  }

  const destaques = calcularDestaques()

  return (
    <Layout menu={<MenuProfessor />}>
      <Titulo>Relatorios</Titulo>

      <div className="flex items-center gap-4 mb-6">
        <Select
          value={turmaSelecionada?.id || ''}
          onChange={(e) => { const turma = turmas.find(t => t.id === e.target.value); setTurmaSelecionada(turma || null); setRelatorio([]); if (turma) gerarRelatorio(turma) }}
        >
          <option value="">Selecione a turma</option>
          {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </Select>
        {turmaSelecionada && <span className="text-blue-600 font-semibold">Periodo ativo: {labelPeriodo(turmaSelecionada)}</span>}
      </div>

      {carregando && <p className="text-gray-400">Carregando...</p>}

      {destaques && relatorio.length > 0 && (
        <div className="mb-6 p-5 bg-yellow-50 border border-yellow-200 rounded-xl">
          <h3 className="font-semibold text-gray-700 mb-3">Destaques do periodo</h3>
          <div className="flex gap-8 flex-wrap text-sm">
            <div>
              <p className="font-semibold mb-1">🏆 Top 3 em notas</p>
              {destaques.top3.map((id, i) => {
                const linha = relatorio.find(r => r.aluno.id === id)
                return <div key={id} className="text-gray-600">{i + 1}º {linha?.aluno.nome} — media {linha?.mediaGeral}</div>
              })}
            </div>
            {destaques.melhorPart && (
              <div>
                <p className="font-semibold mb-1">🙋 Maior participacao</p>
                <div className="text-gray-600">{destaques.melhorPart.aluno.nome} — {destaques.melhorPart.notaPart}</div>
              </div>
            )}
            {destaques.melhorMini && (
              <div>
                <p className="font-semibold mb-1">📝 Melhor miniteste</p>
                <div className="text-gray-600">{destaques.melhorMini.aluno.nome} — {destaques.melhorMini.notaMini}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {relatorio.length > 0 && (
        <div>
          <p className="text-gray-400 text-xs mb-2">Clique no campo para editar. A nota e salva automaticamente ao sair do campo.</p>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Aluno</th>
                  {provas.map(p => (
                    <th key={p.id} className="px-4 py-3 text-center">
                      {p.nome}<br />
                      <span className="font-normal normal-case">{p.data ? new Date(p.data).toLocaleDateString('pt-BR') : p.criado_em ? new Date(p.criado_em).toLocaleDateString('pt-BR') : '-'}</span>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center">ADR</th>
                  <th className="px-4 py-3 text-center">Miniteste</th>
                  <th className="px-4 py-3 text-center">Participacao</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {relatorio.map(({ aluno, notasProva, adr, notaMini, notaPart }) => {
                  const isTop3 = destaques?.top3.includes(aluno.id)
                  return (
                    <tr key={aluno.id} className={isTop3 ? 'bg-yellow-50' : ''}>
                      <td className="px-4 py-3 font-medium">
                        {aluno.nome}
                        {isTop3 && <span className="ml-1 text-xs">🏆</span>}
                        {destaques?.melhorPart?.aluno.id === aluno.id && <span className="ml-1 text-xs">🙋</span>}
                        {destaques?.melhorMini?.aluno.id === aluno.id && <span className="ml-1 text-xs">📝</span>}
                      </td>
                      {provas.map(p => {
                        const valorAtual = editando[`${aluno.id}__prova_${p.id}`] ?? notasProva[p.id]?.nota ?? ''
                        return (
                          <td key={p.id} className="px-2 py-2">
                            <input
                              type="number" min="0" max="10" step="0.1"
                              value={valorAtual}
                              onChange={(e) => setEditando(prev => ({ ...prev, [`${aluno.id}__prova_${p.id}`]: e.target.value }))}
                              onBlur={(e) => salvarNota(aluno.id, 'prova', p.id, e.target.value)}
                              className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-center"
                            />
                          </td>
                        )
                      })}
                      <td className="px-2 py-2">
                        <input
                          type="number" min="0" max="10" step="0.1"
                          value={editando[`${aluno.id}__adr`] ?? adr?.nota ?? ''}
                          onChange={(e) => setEditando(prev => ({ ...prev, [`${aluno.id}__adr`]: e.target.value }))}
                          onBlur={(e) => salvarNota(aluno.id, 'adr', null, e.target.value)}
                          className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-center"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">{notaMini ?? '-'}</td>
                      <td className="px-4 py-3 text-center">{notaPart ?? '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  )
}