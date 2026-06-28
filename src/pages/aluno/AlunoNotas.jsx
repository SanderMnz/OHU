import { useEffect, useState } from 'react'
import MenuAluno from '../../components/MenuAluno'
import { supabase } from '../../lib/supabase'

export default function AlunoNotas() {
  const [turma, setTurma] = useState(null)
  const [periodos, setPeriodos] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    buscarDados()
  }, [])

  async function buscarDados() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: turmaAluno } = await supabase
      .from('turma_aluno')
      .select('turmas(*)')
      .eq('aluno_id', session.user.id)
      .single()

    if (!turmaAluno) return
    const t = turmaAluno.turmas
    setTurma(t)

    const tipoPeriodo = t.tipo === 'eja' ? 'Trimestre' : 'Bimestre'
    const resultados = []

    for (let p = 1; p <= t.periodo_ativo; p++) {
      const { data: provas } = await supabase
        .from('provas')
        .select('id, nome')
        .eq('turma_id', t.id)
        .eq('bimestre', p)

      const notasProva = []
      for (const prova of provas || []) {
        const { data: nota } = await supabase
          .from('notas_prova')
          .select('nota')
          .eq('prova_id', prova.id)
          .eq('aluno_id', session.user.id)
          .maybeSingle()
        notasProva.push({ nome: prova.nome, nota: nota?.nota ?? '-' })
      }

      const { data: adrData } = await supabase
        .from('notas_adr')
        .select('nota')
        .eq('aluno_id', session.user.id)
        .eq('turma_id', t.id)
        .eq('bimestre', p)
        .maybeSingle()
      const notaAdr = adrData?.nota ?? '-'

      const { data: miniData } = await supabase
        .from('registros_miniteste')
        .select('presente, descricao, data')
        .eq('aluno_id', session.user.id)
        .eq('turma_id', t.id)
        .eq('bimestre', p)
        .order('data')
      const totalMini = miniData?.length || 0
      const presentesMini = miniData?.filter(r => r.presente).length || 0
      const notaMini = totalMini > 0 ? ((presentesMini / totalMini) * 10).toFixed(1) : '-'

      const { data: partData } = await supabase
        .from('registros_participacao')
        .select('participou, descricao, data')
        .eq('aluno_id', session.user.id)
        .eq('turma_id', t.id)
        .eq('bimestre', p)
        .order('data')
      const totalPart = partData?.length || 0
      const participou = partData?.filter(r => r.participou).length || 0
      const notaPart = totalPart > 0 ? ((participou / totalPart) * 10).toFixed(1) : '-'

      // Conteudos vinculados a turma no periodo
      const { data: conteudosVinculados } = await supabase
        .from('turma_conteudo')
        .select('conteudos(id, titulo, listas(id, titulo, numero))')
        .eq('turma_id', t.id)
        .eq('bimestre', p)
        .order('ordem')

      const { data: tentativas } = await supabase
        .from('tentativas_lista')
        .select('lista_id, acertos, numero_tentativa')
        .eq('aluno_id', session.user.id)

      const tentativasMap = {}
      for (const tent of tentativas || []) {
        if (!tentativasMap[tent.lista_id]) {
          tentativasMap[tent.lista_id] = { total: 0, melhorAcertos: 0 }
        }
        tentativasMap[tent.lista_id].total++
        if (tent.acertos > tentativasMap[tent.lista_id].melhorAcertos) {
          tentativasMap[tent.lista_id].melhorAcertos = tent.acertos
        }
      }

      const conteudosComListas = (conteudosVinculados || []).map(cv => {
        const conteudo = cv.conteudos
        const listas = (conteudo?.listas || [])
          .sort((a, b) => a.numero - b.numero)
          .map(l => ({
            id: l.id,
            titulo: l.titulo,
            numero: l.numero,
            tentativas: tentativasMap[l.id]?.total || 0,
            melhorAcertos: tentativasMap[l.id]?.melhorAcertos || 0
          }))
        return { titulo: conteudo?.titulo, listas }
      })

      resultados.push({
        periodo: p,
        label: `${p}º ${tipoPeriodo}`,
        notasProva,
        notaAdr,
        notaMini,
        notaPart,
        miniRegistros: miniData || [],
        partRegistros: partData || [],
        exercicios: conteudosComListas
      })
    }

    setPeriodos(resultados)
    setCarregando(false)
  }

  if (carregando) return (
    <div style={{ display: 'flex' }}>
      <MenuAluno />
      <div style={{ padding: '20px' }}><p>Carregando...</p></div>
    </div>
  )

  return (
    <div style={{ display: 'flex' }}>
      <MenuAluno />
      <div style={{ padding: '20px', maxWidth: '800px' }}>
        <h1>Minhas Notas</h1>
        {turma && <p>Turma: {turma.nome}</p>}

        {periodos.length === 0 && <p>Nenhuma nota disponivel ainda.</p>}

        {periodos.map(p => (
          <div key={p.periodo} style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '30px' }}>
            <h2>{p.label}</h2>

            <h3>Notas</h3>
            <table border="1" cellPadding="8">
              <tbody>
                {p.notasProva.map((prova, i) => (
                  <tr key={i}>
                    <td>{prova.nome}</td>
                    <td>{prova.nota}</td>
                  </tr>
                ))}
                <tr>
                  <td>ADR</td>
                  <td>{p.notaAdr}</td>
                </tr>
                <tr>
                  <td>Miniteste</td>
                  <td>{p.notaMini}</td>
                </tr>
                <tr>
                  <td>Participacao</td>
                  <td>{p.notaPart}</td>
                </tr>
              </tbody>
            </table>

            {p.miniRegistros.length > 0 && (
              <>
                <h3>Historico de Minitestes</h3>
                <table border="1" cellPadding="8">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Descricao</th>
                      <th>Presenca</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.miniRegistros.map((r, i) => (
                      <tr key={i}>
                        <td>{new Date(r.data).toLocaleDateString('pt-BR')}</td>
                        <td>{r.descricao}</td>
                        <td>{r.presente ? '✅' : '❌'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {p.partRegistros.length > 0 && (
              <>
                <h3>Historico de Participacao</h3>
                <table border="1" cellPadding="8">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Descricao</th>
                      <th>Participou</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.partRegistros.map((r, i) => (
                      <tr key={i}>
                        <td>{new Date(r.data).toLocaleDateString('pt-BR')}</td>
                        <td>{r.descricao}</td>
                        <td>{r.participou ? '✅' : '❌'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {p.exercicios.length > 0 && (
              <>
                <h3>Listas Digitais</h3>
                {p.exercicios.map((c, i) => (
                  <div key={i} style={{ marginBottom: '15px' }}>
                    <strong>{c.titulo}</strong>
                    {c.listas.length === 0 && (
                      <p style={{ color: 'gray', fontSize: '13px' }}>Nenhuma lista disponivel.</p>
                    )}
                    {c.listas.length > 0 && (
                      <table border="1" cellPadding="6" style={{ marginTop: '6px', width: '100%' }}>
                        <thead>
                          <tr>
                            <th>Lista</th>
                            <th>Tentativas</th>
                            <th>Melhor resultado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {c.listas.map((l, j) => (
                            <tr key={j}>
                              <td>Lista {l.numero} — {l.titulo}</td>
                              <td>{l.tentativas === 0 ? 'Nao feita' : l.tentativas}</td>
                              <td>{l.tentativas === 0 ? '-' : `${((l.melhorAcertos / 5) * 100).toFixed(0)}%`}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}