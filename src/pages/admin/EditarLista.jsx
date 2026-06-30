import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MenuAdmin from '../../components/MenuAdmin'
import Layout from '../../components/Layout'
import { Titulo, Subtitulo, Botao, Tabela } from '../../components/UI'
import { supabase } from '../../lib/supabase'

export default function TurmaConteudos() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [turma, setTurma] = useState(null)
  const [conteudosVinculados, setConteudosVinculados] = useState([])
  const [todosConteudos, setTodosConteudos] = useState([])

  useEffect(() => { buscarTurma(); buscarConteudosVinculados(); buscarTodosConteudos() }, [])

  async function buscarTurma() {
    const { data } = await supabase.from('turmas').select('*').eq('id', id).single()
    setTurma(data)
  }

  async function buscarConteudosVinculados() {
    const { data } = await supabase.from('turma_conteudo').select('*, conteudos(titulo)').eq('turma_id', id).order('bimestre').order('ordem')
    setConteudosVinculados(data || [])
  }

  async function buscarTodosConteudos() {
    const { data } = await supabase.from('conteudos').select('*').order('ordem')
    setTodosConteudos(data || [])
  }

  async function vincularConteudo(conteudoId) {
    if (!turma) return
    const jaVinculado = conteudosVinculados.find(v => v.conteudo_id === conteudoId && v.bimestre === turma.periodo_ativo)
    if (jaVinculado) return
    const ordemAtual = conteudosVinculados.filter(v => v.bimestre === turma.periodo_ativo).length + 1
    await supabase.from('turma_conteudo').insert({ turma_id: id, conteudo_id: conteudoId, bimestre: turma.periodo_ativo, ordem: ordemAtual })
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
    return conteudosVinculados.some(v => v.conteudo_id === conteudoId && v.bimestre === turma?.periodo_ativo)
  }

  if (!turma) return <Layout menu={<MenuAdmin />}><p className="text-gray-400">Carregando...</p></Layout>

  return (
    <Layout menu={<MenuAdmin />}>
      <Botao onClick={() => navigate('/admin/turmas')} variante="secondary">← Voltar</Botao>
      <Titulo>Conteudos da Turma {turma.nome}</Titulo>
      <p className="text-gray-500 mb-6">Periodo ativo: <span className="font-semibold text-blue-600">{labelPeriodo(turma)}</span></p>

      <Subtitulo>Selecione os conteudos do periodo</Subtitulo>
      <p className="text-gray-400 text-sm mb-4">Clique em um conteudo para vincular ou desvincular da turma neste periodo.</p>

      <div className="flex flex-wrap gap-4 mb-8">
        {todosConteudos.map(c => {
          const vinculado = isVinculado(c.id)
          const vinculo = conteudosVinculados.find(v => v.conteudo_id === c.id && v.bimestre === turma.periodo_ativo)
          return (
            <div
              key={c.id}
              onClick={() => vinculado ? desvincularConteudo(vinculo.id) : vincularConteudo(c.id)}
              className={`border-2 rounded-xl p-4 min-w-[200px] cursor-pointer transition ${vinculado ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white hover:border-blue-300'}`}
            >
              <p className="font-semibold text-gray-800">{c.titulo}</p>
              {c.descricao && <p className="text-xs text-gray-500 mt-1">{c.descricao}</p>}
              <p className={`text-xs mt-2 font-medium ${vinculado ? 'text-green-600' : 'text-gray-400'}`}>
                {vinculado ? `✅ Vinculado (ordem ${vinculo.ordem})` : 'Clique para vincular'}
              </p>
            </div>
          )
        })}
      </div>

      <Subtitulo>Conteudos vinculados neste periodo</Subtitulo>
      {conteudosVinculados.filter(v => v.bimestre === turma.periodo_ativo).length === 0 && (
        <p className="text-gray-400">Nenhum conteudo vinculado ainda.</p>
      )}
      <Tabela cabecalho={['Ordem', 'Conteudo', 'Acoes']}>
        {conteudosVinculados.filter(v => v.bimestre === turma.periodo_ativo).map(v => (
          <tr key={v.id} className="hover:bg-gray-50">
            <td className="px-4 py-3">{v.ordem}</td>
            <td className="px-4 py-3 font-medium">{v.conteudos?.titulo}</td>
            <td className="px-4 py-3">
              <Botao onClick={() => desvincularConteudo(v.id)} variante="danger">Remover</Botao>
            </td>
          </tr>
        ))}
      </Tabela>
    </Layout>
  )
}