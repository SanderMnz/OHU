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

    const maxPeriodo = t.tipo === 'eja' ? 3 : 4
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
          .single()
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
        .select('presente')
        .eq('aluno_id', session.user.id)
        .eq('turma_id', t.id)
        .eq('bimestre', p)
      const totalMini = miniData?.length || 0
      const presentesMini = miniData?.filter(r => r.presente).length || 0
      const notaMini = totalMini > 0 ? ((presentesMini / totalMini) * 10).toFixed(1) : '-'

      const { data: partData } = await supabase
        .from('registros_participacao')
        .select('participou')
        .eq('aluno_id', session.user.id)
        .eq('turma_id', t.id)
        .eq('bimestre', p)
      const totalPart = partData?.length || 0
      const participou = partData?.filter(r => r.participou).length || 0
      const notaPart = totalPart > 0 ? ((participou / totalPart) * 10).toFixed(1) : '-'

      resultados.push({
        periodo: p,
        label: `${p}º ${tipoPeriodo}`,
        notasProva,
        notaAdr,
        notaMini,
        notaPart
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
      <div style={{ padding: '20px' }}>
        <h1>Minhas Notas</h1>
        {turma && <p>Turma: {turma.nome}</p>}

        {periodos.length === 0 && <p>Nenhuma nota disponivel ainda.</p>}

        {periodos.map(p => (
          <div key={p.periodo} style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px' }}>
            <h2>{p.label}</h2>
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
          </div>
        ))}
      </div>
    </div>
  )
}