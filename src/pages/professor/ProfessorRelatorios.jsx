import { useEffect, useState } from 'react'
import MenuProfessor from '../../components/MenuProfessor'
import { supabase } from '../../lib/supabase'

export default function ProfessorRelatorios() {
  const [turmas, setTurmas] = useState([])
  const [turmaSelecionada, setTurmaSelecionada] = useState(null)
  const [relatorio, setRelatorio] = useState([])
  const [provas, setProvas] = useState([])
  const [carregando, setCarregando] = useState(false)

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

  async function gerarRelatorio() {
    if (!turmaSelecionada) return
    setCarregando(true)

    const { data: alunosData } = await supabase
      .from('turma_aluno')
      .select('usuarios(id, nome)')
      .eq('turma_id', turmaSelecionada.id)
    const alunos = alunosData?.map(a => a.usuarios) || []

    const { data: provasData } = await supabase
      .from('provas')
      .select('*')
      .eq('turma_id', turmaSelecionada.id)
      .eq('bimestre', turmaSelecionada.periodo_ativo)
    setProvas(provasData || [])

    const linhas = await Promise.all(alunos.map(async (aluno) => {
      const notasProva = {}
      for (const prova of provasData || []) {
        const { data } = await supabase
          .from('notas_prova')
          .select('nota')
          .eq('prova_id', prova.id)
          .eq('aluno_id', aluno.id)
          .single()
        notasProva[prova.id] = data?.nota ?? '-'
      }

      const { data: adrData } = await supabase
        .from('notas_adr')
        .select('nota')
        .eq('aluno_id', aluno.id)
        .eq('turma_id', turmaSelecionada.id)
        .eq('bimestre', turmaSelecionada.periodo_ativo)
        .single()
      const notaAdr = adrData?.nota ?? '-'

      const { data: miniData } = await supabase
        .from('registros_miniteste')
        .select('presente')
        .eq('aluno_id', aluno.id)
        .eq('turma_id', turmaSelecionada.id)
        .eq('bimestre', turmaSelecionada.periodo_ativo)
      const totalMini = miniData?.length || 0
      const presentesMini = miniData?.filter(r => r.presente).length || 0
      const notaMini = totalMini > 0 ? ((presentesMini / totalMini) * 10).toFixed(1) : '-'

      const { data: partData } = await supabase
        .from('registros_participacao')
        .select('participou')
        .eq('aluno_id', aluno.id)
        .eq('turma_id', turmaSelecionada.id)
        .eq('bimestre', turmaSelecionada.periodo_ativo)
      const totalPart = partData?.length || 0
      const participou = partData?.filter(r => r.participou).length || 0
      const notaPart = totalPart > 0 ? ((participou / totalPart) * 10).toFixed(1) : '-'

      return { aluno, notasProva, notaAdr, notaMini, notaPart }
    }))

    setRelatorio(linhas)
    setCarregando(false)
  }

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

          {turmaSelecionada && (
            <button onClick={gerarRelatorio} style={{ marginLeft: '15px' }}>
              Gerar relatorio
            </button>
          )}
        </div>

        {carregando && <p>Carregando...</p>}

        {relatorio.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table border="1" cellPadding="8">
              <thead>
                <tr>
                  <th>Aluno</th>
                  {provas.map(p => <th key={p.id}>{p.nome}</th>)}
                  <th>ADR</th>
                  <th>Miniteste</th>
                  <th>Participacao</th>
                </tr>
              </thead>
              <tbody>
                {relatorio.map(({ aluno, notasProva, notaAdr, notaMini, notaPart }) => (
                  <tr key={aluno.id}>
                    <td>{aluno.nome}</td>
                    {provas.map(p => <td key={p.id}>{notasProva[p.id]}</td>)}
                    <td>{notaAdr}</td>
                    <td>{notaMini}</td>
                    <td>{notaPart}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}