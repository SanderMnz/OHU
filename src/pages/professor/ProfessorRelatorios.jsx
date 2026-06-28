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
      const notaMini = totalMini > 0 ? ((presentesMini / totalMini) * 10).toFixed(1) : '-'

      const { data: partData } = await supabase
        .from('registros_participacao')
        .select('participou')
        .eq('aluno_id', aluno.id)
        .eq('turma_id', turma.id)
        .eq('bimestre', turma.periodo_ativo)
      const totalPart = partData?.length || 0
      const participou = partData?.filter(r => r.participou).length || 0
      const notaPart = totalPart > 0 ? ((participou / totalPart) * 10).toFixed(1) : '-'

      return {
        aluno,
        notasProva,
        adr: { id: adrData?.id, nota: adrData?.nota ?? '' },
        notaMini,
        notaPart
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

        {relatorio.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <p style={{ color: 'gray', fontSize: '13px' }}>
              Clique no campo para editar. A nota e salva automaticamente ao sair do campo.
            </p>
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
                {relatorio.map(({ aluno, notasProva, adr, notaMini, notaPart }) => (
                  <tr key={aluno.id}>
                    <td>{aluno.nome}</td>
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