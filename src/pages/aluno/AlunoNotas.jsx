import { useEffect, useState } from 'react'
import MenuAluno from '../../components/MenuAluno'
import Layout from '../../components/Layout'
import { Titulo } from '../../components/UI'
import { supabase } from '../../lib/supabase'

export default function AlunoNotas() {
  const [turma, setTurma] = useState(null)
  const [periodos, setPeriodos] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => { buscarDados() }, [])

  function calcularMedia(notasProva, notaAdr, notaMini, notaPart) {
    const valores = []
    notasProva.forEach(p => { if (p.nota !== '-') valores.push(parseFloat(p.nota)) })
    if (notaAdr !== '-') valores.push(parseFloat(notaAdr))
    if (notaMini !== '-') valores.push(parseFloat(notaMini))
    if (notaPart !== '-') valores.push(parseFloat(notaPart))
    if (valores.length === 0) return '-'
    return (valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(1)
  }

  async function buscarDados() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: turmaAluno } = await supabase.from('turma_aluno').select('turmas(*)').eq('aluno_id', session.user.id).single()
    if (!turmaAluno) return
    const t = turmaAluno.turmas
    setTurma(t)

    const tipoPeriodo = t.tipo === 'eja' ? 'Trimestre' : 'Bimestre'
    const resultados = []

    for (let p = 1; p <= t.periodo_ativo; p++) {
      const { data: provas } = await supabase.from('provas').select('id, nome').eq('turma_id', t.id).eq('bimestre', p)
      const notasProva = []
      for (const prova of provas || []) {
        const { data: nota } = await supabase.from('notas_prova').select('nota').eq('prova_id', prova.id).eq('aluno_id', session.user.id).maybeSingle()
        notasProva.push({ nome: prova.nome, nota: nota?.nota ?? '-' })
      }

      const { data: adrData } = await supabase.from('notas_adr').select('nota').eq('aluno_id', session.user.id).eq('turma_id', t.id).eq('bimestre', p).maybeSingle()
      const notaAdr = adrData?.nota ?? '-'

      const { data: miniData } = await supabase.from('registros_miniteste').select('presente, descricao, data').eq('aluno_id', session.user.id).eq('turma_id', t.id).eq('bimestre', p).order('data')
      const totalMini = miniData?.length || 0
      const presentesMini = miniData?.filter(r => r.presente).length || 0
      const notaMini = totalMini > 0 ? ((presentesMini / totalMini) * 10).toFixed(1) : '-'

      const { data: partData } = await supabase.from('registros_participacao').select('participou, descricao, data').eq('aluno_id', session.user.id).eq('turma_id', t.id).eq('bimestre', p).order('data')
      const totalPart = partData?.length || 0
      const participou = partData?.filter(r => r.participou).length || 0
      const notaPart = totalPart > 0 ? ((participou / totalPart) * 10).toFixed(1) : '-'

      const media = calcularMedia(notasProva, notaAdr, notaMini, notaPart)

      const { data: conteudosVinculados } = await supabase
        .from('turma_conteudo')
        .select('conteudos(id, titulo, listas(id, titulo, numero))')
        .eq('turma_id', t.id).eq('bimestre', p).order('ordem')

      const { data: tentativas } = await supabase.from('tentativas_lista').select('lista_id, acertos, numero_tentativa').eq('aluno_id', session.user.id)
      const tentativasMap = {}
      for (const tent of tentativas || []) {
        if (!tentativasMap[tent.lista_id]) tentativasMap[tent.lista_id] = { total: 0, melhorAcertos: 0 }
        tentativasMap[tent.lista_id].total++
        if (tent.acertos > tentativasMap[tent.lista_id].melhorAcertos) tentativasMap[tent.lista_id].melhorAcertos = tent.acertos
      }

      const conteudosComListas = (conteudosVinculados || []).map(cv => {
        const conteudo = cv.conteudos
        const listas = (conteudo?.listas || []).sort((a, b) => a.numero - b.numero).map(l => ({
          id: l.id, titulo: l.titulo, numero: l.numero,
          tentativas: tentativasMap[l.id]?.total || 0,
          melhorAcertos: tentativasMap[l.id]?.melhorAcertos || 0
        }))
        return { titulo: conteudo?.titulo, listas }
      })

      resultados.push({
        periodo: p, label: `${p}º ${tipoPeriodo}`, ativo: p === t.periodo_ativo,
        notasProva, notaAdr, notaMini, notaPart, media,
        miniRegistros: miniData || [], partRegistros: partData || [], exercicios: conteudosComListas
      })
    }

    const ordenados = [...resultados.filter(r => r.ativo), ...resultados.filter(r => !r.ativo).reverse()]
    setPeriodos(ordenados)
    setCarregando(false)
  }

  function corMedia(media) {
    if (media === '-') return 'text-white'
    const valor = parseFloat(media)
    if (valor >= 7) return 'text-green-300'
    if (valor >= 5) return 'text-yellow-200'
    return 'text-red-300'
  }

  if (carregando) return <Layout menu={<MenuAluno />}><p className="text-gray-400">Carregando...</p></Layout>

  return (
    <Layout menu={<MenuAluno />}>
      <Titulo>Minhas Notas</Titulo>
      {turma && <p className="text-gray-500 mb-8">Turma <span className="font-semibold text-gray-700">{turma.nome}</span></p>}

      {periodos.length === 0 && <p className="text-gray-400">Nenhuma nota disponível ainda.</p>}

      <div className="space-y-8">
        {periodos.map(p => (
          <div
            key={p.periodo}
            className={`rounded-2xl overflow-hidden border ${p.ativo ? 'border-blue-200 shadow-md' : 'border-gray-200 shadow-sm'}`}
          >
            <div className={`px-6 py-4 flex items-center justify-between ${p.ativo ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
              <h2 className="text-lg font-bold">{p.label}</h2>
              {p.ativo && <span className="text-xs bg-white text-blue-600 px-3 py-1 rounded-full font-semibold">Período atual</span>}
            </div>

            <div className="bg-white p-6">
              <div className="flex items-center justify-between bg-blue-600 rounded-xl p-5 mb-6 text-white">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Média do período</p>
                  <p className={`text-4xl font-bold mt-1 ${corMedia(p.media)}`}>{p.media}</p>
                </div>
                <div className="text-5xl opacity-30">📊</div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {p.notasProva.map((prova, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1 truncate">{prova.nome}</p>
                    <p className="text-2xl font-bold text-gray-800">{prova.nota}</p>
                  </div>
                ))}
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">ADR</p>
                  <p className="text-2xl font-bold text-gray-800">{p.notaAdr}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Miniteste</p>
                  <p className="text-2xl font-bold text-gray-800">{p.notaMini}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Participação</p>
                  <p className="text-2xl font-bold text-gray-800">{p.notaPart}</p>
                </div>
              </div>

              {p.ativo && p.miniRegistros.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">Histórico de Minitestes</h3>
                  <div className="overflow-x-auto rounded-lg border border-gray-100">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                        <tr>
                          <th className="px-3 py-2 text-left">Data</th>
                          <th className="px-3 py-2 text-left">Descrição</th>
                          <th className="px-3 py-2 text-center">Presença</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {p.miniRegistros.map((r, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 text-gray-500">{new Date(r.data).toLocaleDateString('pt-BR')}</td>
                            <td className="px-3 py-2">{r.descricao}</td>
                            <td className="px-3 py-2 text-center">{r.presente ? '✅' : '❌'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {p.ativo && p.partRegistros.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">Histórico de Participação</h3>
                  <div className="overflow-x-auto rounded-lg border border-gray-100">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                        <tr>
                          <th className="px-3 py-2 text-left">Data</th>
                          <th className="px-3 py-2 text-left">Descricao</th>
                          <th className="px-3 py-2 text-center">Participou</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {p.partRegistros.map((r, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 text-gray-500">{new Date(r.data).toLocaleDateString('pt-BR')}</td>
                            <td className="px-3 py-2">{r.descricao}</td>
                            <td className="px-3 py-2 text-center">{r.participou ? '✅' : '❌'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {p.ativo && p.exercicios.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">Listas Digitais</h3>
                  <div className="space-y-4">
                    {p.exercicios.map((c, i) => (
                      <div key={i}>
                        <p className="font-semibold text-gray-700 text-sm mb-2">{c.titulo}</p>
                        {c.listas.length === 0 ? (
                          <p className="text-gray-400 text-xs">Nenhuma lista disponivel.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {c.listas.map((l, j) => (
                              <div key={j} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2 text-sm">
                                <span>Lista {l.numero} — {l.titulo}</span>
                                <span className={`font-semibold ${l.tentativas === 0 ? 'text-gray-400' : 'text-blue-600'}`}>
                                  {l.tentativas === 0 ? 'Não feita' : `${((l.melhorAcertos / 5) * 100).toFixed(0)}%`}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}