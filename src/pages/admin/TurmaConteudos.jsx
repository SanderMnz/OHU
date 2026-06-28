import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MenuAdmin from '../../components/MenuAdmin'
import { supabase } from '../../lib/supabase'

export default function TurmaConteudos() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [turma, setTurma] = useState(null)
  const [conteudosVinculados, setConteudosVinculados] = useState([])
  const [todosConteudos, setTodosConteudos] = useState([])

  useEffect(() => {
    buscarTurma()
    buscarConteudosVinculados()
    buscarTodosConteudos()
  }, [])

  async function buscarTurma() {
    const { data } = await supabase
      .from('turmas')
      .select('*')
      .eq('id', id)
      .single()
    setTurma(data)
  }

  async function buscarConteudosVinculados() {
    const { data } = await supabase
      .from('turma_conteudo')
      .select('*, conteudos(titulo)')
      .eq('turma_id', id)
      .order('bimestre')
      .order('ordem')
    setConteudosVinculados(data || [])
  }

  async function buscarTodosConteudos() {
    const { data } = await supabase
      .from('conteudos')
      .select('*')
      .order('ordem')
    setTodosConteudos(data || [])
  }

  async function vincularConteudo(conteudoId) {
    if (!turma) return
    const jaVinculado = conteudosVinculados.find(
      v => v.conteudo_id === conteudoId && v.bimestre === turma.periodo_ativo
    )
    if (jaVinculado) return

    const ordemAtual = conteudosVinculados.filter(
      v => v.bimestre === turma.periodo_ativo
    ).length + 1

    await supabase.from('turma_conteudo').insert({
      turma_id: id,
      conteudo_id: conteudoId,
      bimestre: turma.periodo_ativo,
      ordem: ordemAtual
    })

    buscarConteudosVinculados()
  }

  async function desvincularConteudo(vinculoId) {
    await supabase.from('turma_conteudo').delete().eq('id', vinculoId)
    buscarConteudosVinculados()
  }

  function labelPeriodo(turma) {
    if (!turma) return ''
    const tipo = turma.tipo === 'eja' ? 'Trimestre' : 'Bimestre'
    return `${turma.periodo_ativo}º ${tipo}`
  }

  function isVinculado(conteudoId) {
    return conteudosVinculados.some(
      v => v.conteudo_id === conteudoId && v.bimestre === turma?.periodo_ativo
    )
  }

  if (!turma) return <p>Carregando...</p>

  return (
    <div style={{ display: 'flex' }}>
      <MenuAdmin />
      <div style={{ padding: '20px' }}>
        <button onClick={() => navigate('/admin/turmas')}>Voltar</button>
        <h1>Conteudos da Turma {turma.nome}</h1>
        <p>Periodo ativo: {labelPeriodo(turma)}</p>

        <h2>Selecione os conteudos do periodo</h2>
        <p style={{ color: 'gray', fontSize: '13px' }}>
          Clique em um conteudo para vincular ou desvincular da turma neste periodo.
        </p>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '30px' }}>
          {todosConteudos.map(c => {
            const vinculado = isVinculado(c.id)
            const vinculo = conteudosVinculados.find(
              v => v.conteudo_id === c.id && v.bimestre === turma.periodo_ativo
            )
            return (
              <div
                key={c.id}
                style={{
                  border: `2px solid ${vinculado ? '#22c55e' : '#ccc'}`,
                  borderRadius: '8px',
                  padding: '12px 16px',
                  minWidth: '200px',
                  background: vinculado ? '#f0fdf4' : 'white',
                  cursor: 'pointer'
                }}
                onClick={() => vinculado ? desvincularConteudo(vinculo.id) : vincularConteudo(c.id)}
              >
                <p style={{ margin: 0, fontWeight: 'bold' }}>{c.titulo}</p>
                {c.descricao && <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'gray' }}>{c.descricao}</p>}
                <p style={{ margin: '8px 0 0', fontSize: '12px', color: vinculado ? '#16a34a' : '#999' }}>
                  {vinculado ? `✅ Vinculado (ordem ${vinculo.ordem})` : 'Clique para vincular'}
                </p>
              </div>
            )
          })}
        </div>

        <h2>Conteudos vinculados neste periodo</h2>
        {conteudosVinculados.filter(v => v.bimestre === turma.periodo_ativo).length === 0 && (
          <p>Nenhum conteudo vinculado ainda.</p>
        )}
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Ordem</th>
              <th>Conteudo</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {conteudosVinculados
              .filter(v => v.bimestre === turma.periodo_ativo)
              .map(v => (
                <tr key={v.id}>
                  <td>{v.ordem}</td>
                  <td>{v.conteudos?.titulo}</td>
                  <td>
                    <button onClick={() => desvincularConteudo(v.id)}>Remover</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}