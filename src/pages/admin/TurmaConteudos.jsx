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
  const [conteudoSelecionado, setConteudoSelecionado] = useState('')
  const [ordem, setOrdem] = useState('')

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

  async function vincularConteudo() {
    if (!conteudoSelecionado || !ordem || !turma) return

    await supabase.from('turma_conteudo').insert({
      turma_id: id,
      conteudo_id: conteudoSelecionado,
      bimestre: turma.periodo_ativo,
      ordem: parseInt(ordem)
    })

    setConteudoSelecionado('')
    setOrdem('')
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

  if (!turma) return <p>Carregando...</p>

  return (
    <div style={{ display: 'flex' }}>
      <MenuAdmin />
      <div style={{ padding: '20px' }}>
        <button onClick={() => navigate('/admin/turmas')}>Voltar</button>
        <h1>Conteudos da Turma {turma.nome}</h1>
        <p>Periodo ativo: {labelPeriodo(turma)}</p>

        <h2>Vincular conteudo</h2>
        <select
          value={conteudoSelecionado}
          onChange={(e) => setConteudoSelecionado(e.target.value)}
        >
          <option value="">Selecione o conteudo</option>
          {todosConteudos.map(c => (
            <option key={c.id} value={c.id}>{c.titulo}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Ordem (1, 2, 3...)"
          value={ordem}
          onChange={(e) => setOrdem(e.target.value)}
          style={{ marginLeft: '10px', width: '80px' }}
        />
        <button onClick={vincularConteudo} style={{ marginLeft: '10px' }}>
          Vincular
        </button>

        <h2>Conteudos vinculados</h2>
        {conteudosVinculados.length === 0 && <p>Nenhum conteudo vinculado ainda.</p>}
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Periodo</th>
              <th>Ordem</th>
              <th>Conteudo</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {conteudosVinculados.map(v => (
              <tr key={v.id}>
                <td>{v.bimestre}º</td>
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