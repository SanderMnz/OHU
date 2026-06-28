import { useEffect, useState } from 'react'
import MenuProfessor from '../../components/MenuProfessor'
import { supabase } from '../../lib/supabase'

export default function ProfessorRelatorios() {
  const [turmas, setTurmas] = useState([])
  const [turmaSelecionada, setTurmaSelecionada] = useState(null)
  const [relatorio, setRelatorio] = useState([])
  const [provas, setProvas] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [editando, setEditando] = useState({})

  useEffect(() => {
    buscarTurmas()
  }, [])

  async function buscarTurmas() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase
      .from('turma_professor')
      .select('turmas(*)')
      .eq('professor_id', session.user.id)
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

    const { data: alunosData } = await supabase
      .from('turma_aluno')
      .select('usuarios(id, nome)')
      .eq('turma_id', turma.id)
    const alunos = alunosData?.map(a => a.usuarios) || []

    const { data: provasData } = await supabase
      .from('provas')
      .select('*')
      .eq('turma_id', turma.id)
      .eq('bimestre', turma.periodo_ativo)
      .order('criado_em')
    setProvas(provasData || [])

    const linhas = await Promise.all(alunos.map(async (aluno) => {
      const notasProva = {}
      for (const prova of provasData || []) {
        const { data } = await supabase
          .from('notas_prova')
          .select('id, nota')
          .eq('prova_id', prova.id)
          .eq('aluno_id', aluno.id)
          .maybeSingle()
        notasProva[prova.id] = { id: data?.id, nota: data?.nota ?? '' }
      }

      const { data: adrData } = await supabase
        .from('notas_adr')
        .select('id, nota')
        .eq('aluno_id', aluno.id)
        .eq('turma_id', turma.id)
        .eq('bimestre', turma.periodo_ativo)
        .maybeSingle()

      const { data: miniData } = await supabase
        .from('registros_miniteste')
        .select('presente')
        .eq('aluno_id', aluno.id)
        .eq('turma_id', turma.id)
        .eq('bimestre', turma.periodo_ativo)
      const totalMini = miniData?.length || 0
      const presentesMini = miniData?.filter(r => r.presente).length || 0
      const notaMini = totalMini > 0 ? ((presentesMini / totalMini) * 10).toFixed(1) : null

      const { data: partData } = await supabase
        .from('registros_participacao')
        .select('participou')
        .eq('aluno_id', aluno.id)
        .eq('turma_id', turma.id)
        .eq('bimestre', turma.periodo_ativo)
      const totalPart = partData?.length || 0
      const participou = partData?.filter(r => r.participou).length || 0
      const notaPart = totalPart > 0 ? ((participou / totalPart) * 10).toFixed(1) : null

      const mediasProva = Object.values(notasProva)
        .map(n => parseFloat(n.nota))
        .filter(n => !isNaN(n))
      const mediaGeral = mediasProva.length > 0
        ? (mediasProva.reduce((a, b) => a + b, 0) / mediasProva.length).toFixed(1)
        : null

      return {
        aluno,
        notasProva,
        adr: { id: adrData?.id, nota: adrData?.nota ?? '' },
        notaMini,
        notaPart,
        mediaGeral: parseFloat(mediaGeral)
      }
    }))

    setRelatorio(linhas)
    setCarregando(false)
  }

  async function salvarNota(alunoId, campo, provaId, valor) {
    if (valor === undefined || valor === '') return
    const nota = parseFloat(valor)
    if (isNaN(nota) || nota < 0 || nota > 10) {
      alert('Nota invalida. Digite um valor entre 0 e 10.')
      return
    }

    if (provaId) {
      const linha = relatorio.find(r => r.aluno.id === alunoId)
      const existing = linha?.notasProva[provaId]
      if (existing?.id) {
        await supabase.from('notas_prova').update({ nota }).eq('id', existing.id)
      } else {
        await supabase.from('notas_prova').insert({ prova_id: provaId, aluno_id: alunoId, nota })
      }
    } else if (campo === 'adr') {
      const linha = relatorio.find(r => r.aluno.id === alunoId)
      if (linha?.adr?.id) {
        await supabase.from('notas_adr').update({ nota }).eq('id', linha.adr.id)
      } else {
        await supabase.from('notas_adr').insert({
          aluno_id: alunoId,
          turma_id: turmaSelecionada.id,
          bimestre: turmaSelecionada.periodo_ativo,
          nota
        })
      }
    }

    gerarRelatorio(turmaSelecionada)
  }

  // Calcula destaques
  function calcularDestaques() {
    if (relatorio.length === 0) return null

    const comNota = relatorio.filter(r => !isNaN(r.mediaGeral))
    const top3 = [...comNota]
      .sort((a, b) => b.mediaGeral - a.mediaGeral)
      .slice(0, 3)
      .map(r => r.aluno.id)

    const comMini = relatorio.filter(r => r.notaMini !== null)
    const melhorMini = comMini.length > 0
      ? comMini.reduce((a, b) => parseFloat(a.notaMini) > parseFloat(b.notaMini) ? a : b)
      : null

    const comPart = relatorio.filter(r => r.notaPart !== null)
    const melhorPart = comPart.length > 0
      ? comPart.reduce((a, b) => parseFloat(a.notaPart) > parseFloat(b.notaPart) ? a : b)
      : null

    return { top3, melhorMini, melhorPart }
  }

  const destaques = calcularDestaques()

  return (
    <div style={{ display: 'flex' }}>
      <MenuProfessor />
      <div style={{ padding: '20px' }}>
        <h1>Relatorios</h1>

        <div style={{ marginBottom: '20px' }}>
          <select
            value={turmaSelecionada?.id || ''}
            onChange={(e) => {
              const turma = turmas.find(t => t.id === e.target.value)
              setTurmaSelecionada(turma || null)
              setRelatorio([])
              if (turma) gerarRelatorio(turma)
            }}
          >
            <option value="">Selecione a turma</option>
            {turmas.map(t => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>

          {turmaSelecionada && (
            <strong style={{ marginLeft: '15px' }}>
              Periodo ativo: {labelPeriodo(turmaSelecionada)}
            </strong>
          )}
        </div>

        {carregando && <p>Carregando...</p>}

        {destaques && relatorio.length > 0 && (
          <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb' }}>
            <h3 style={{ margin: '0 0 10px' }}>Destaques do periodo</h3>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <strong>🏆 Top 3 em notas</strong>
                {destaques.top3.map((id, i) => {
                  const linha = relatorio.find(r => r.aluno.id === id)
                  return (
                    <div key={id}>
                      {i + 1}º {linha?.aluno.nome} — media {linha?.mediaGeral}
                    </div>
                  )
                })}
              </div>
              {destaques.melhorPart && (
                <div>
                  <strong>🙋 Maior participacao</strong>
                  <div>{destaques.melhorPart.aluno.nome} — {destaques.melhorPart.notaPart}</div>
                </div>
              )}
              {destaques.melhorMini && (
                <div>
                  <strong>📝 Melhor miniteste</strong>
                  <div>{destaques.melhorMini.aluno.nome} — {destaques.melhorMini.notaMini}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {relatorio.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <p style={{ color: 'gray', fontSize: '13px' }}>
              Clique no campo para editar. A nota e salva automaticamente ao sair do campo.
            </p>
            <table border="1" cellPadding="8">
              <thead>
                <tr>
                  <th>Aluno</th>
                  {provas.map(p => (
                    <th key={p.id}>
                      {p.nome}
                      <br />
                      <small>{p.data ? new Date(p.data).toLocaleDateString('pt-BR') : p.criado_em ? new Date(p.criado_em).toLocaleDateString('pt-BR') : '-'}</small>
                    </th>
                  ))}
                  <th>ADR</th>
                  <th>Miniteste</th>
                  <th>Participacao</th>
                </tr>
              </thead>
              <tbody>
                {relatorio.map(({ aluno, notasProva, adr, notaMini, notaPart }) => {
                  const isTop3 = destaques?.top3.includes(aluno.id)
                  return (
                    <tr key={aluno.id} style={{ background: isTop3 ? '#fefce8' : 'white' }}>
                      <td>
                        {aluno.nome}
                        {isTop3 && <span style={{ marginLeft: '5px', fontSize: '12px', color: '#ca8a04' }}>🏆</span>}
                        {destaques?.melhorPart?.aluno.id === aluno.id && <span style={{ marginLeft: '5px', fontSize: '12px' }}>🙋</span>}
                        {destaques?.melhorMini?.aluno.id === aluno.id && <span style={{ marginLeft: '5px', fontSize: '12px' }}>📝</span>}
                      </td>
                      {provas.map(p => {
                        const valorAtual = editando[`${aluno.id}__prova_${p.id}`] ?? notasProva[p.id]?.nota ?? ''
                        return (
                          <td key={p.id} style={{ padding: '4px' }}>
                            <input
                              type="number"
                              min="0" max="10" step="0.1"
                              value={valorAtual}
                              onChange={(e) => setEditando(prev => ({ ...prev, [`${aluno.id}__prova_${p.id}`]: e.target.value }))}
                              onBlur={(e) => salvarNota(aluno.id, 'prova', p.id, e.target.value)}
                              style={{ width: '55px' }}
                            />
                          </td>
                        )
                      })}
                      <td style={{ padding: '4px' }}>
                        <input
                          type="number"
                          min="0" max="10" step="0.1"
                          value={editando[`${aluno.id}__adr`] ?? adr?.nota ?? ''}
                          onChange={(e) => setEditando(prev => ({ ...prev, [`${aluno.id}__adr`]: e.target.value }))}
                          onBlur={(e) => salvarNota(aluno.id, 'adr', null, e.target.value)}
                          style={{ width: '55px' }}
                        />
                      </td>
                      <td>{notaMini ?? '-'}</td>
                      <td>{notaPart ?? '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}