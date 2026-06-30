import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MenuAdmin from '../../components/MenuAdmin'
import Layout from '../../components/Layout'
import { Titulo, Subtitulo, Botao, Input, Tabela, Sucesso, Erro } from '../../components/UI'
import { supabase } from '../../lib/supabase'

async function uploadImagemSupabase(arquivo) {
  const extensao = arquivo.name.split('.').pop()
  const nomeArquivo = `${Date.now()}.${extensao}`
  const { error } = await supabase.storage.from('ImagensOHU').upload(nomeArquivo, arquivo)
  if (error) { console.log('erro upload:', error); return null }
  const { data } = supabase.storage.from('ImagensOHU').getPublicUrl(nomeArquivo)
  return data.publicUrl
}

function TextareaComImagem({ value, onChange, rows, placeholder }) {
  const ref = useRef(null)
  const inputRef = useRef(null)
  const [uploadando, setUploadando] = useState(false)

  async function handleUpload(e) {
    const arquivo = e.target.files[0]
    if (!arquivo) return
    setUploadando(true)
    const url = await uploadImagemSupabase(arquivo)
    if (!url) { alert('Erro ao fazer upload'); setUploadando(false); return }
    const textarea = ref.current
    const inicio = textarea.selectionStart
    const fim = textarea.selectionEnd
    const linkMarkdown = `![imagem](${url})`
    const novoTexto = value.slice(0, inicio) + linkMarkdown + value.slice(fim)
    onChange({ target: { value: novoTexto } })
    setUploadando(false)
    e.target.value = ''
  }

  return (
    <div>
      <div className="mb-2">
        <button type="button" onClick={() => inputRef.current.click()} disabled={uploadando} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition">
          {uploadando ? 'Enviando imagem...' : '📷 Inserir imagem'}
        </button>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      </div>
      <textarea
        ref={ref}
        rows={rows || 10}
        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  )
}

export default function EditarConteudo() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [conteudo, setConteudo] = useState(null)
  const [explicacao, setExplicacao] = useState('')
  const [exemplos, setExemplos] = useState('')
  const [videos, setVideos] = useState([])
  const [listas, setListas] = useState([])
  const [tituloVideo, setTituloVideo] = useState('')
  const [urlVideo, setUrlVideo] = useState('')
  const [tituloLista, setTituloLista] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    buscarConteudo()
    buscarMaterial()
    buscarVideos()
    buscarListas()
  }, [])

  async function buscarConteudo() {
    const { data } = await supabase.from('conteudos').select('*').eq('id', id).single()
    setConteudo(data)
  }

  async function buscarMaterial() {
    const { data } = await supabase.from('conteudo_material').select('*').eq('conteudo_id', id).maybeSingle()
    if (data) { setExplicacao(data.explicacao || ''); setExemplos(data.exemplos || '') }
  }

  async function buscarVideos() {
    const { data } = await supabase.from('conteudo_videos').select('*').eq('conteudo_id', id).order('ordem')
    setVideos(data || [])
  }

  async function buscarListas() {
    const { data } = await supabase.from('listas').select('*').eq('conteudo_id', id).order('numero')
    setListas(data || [])
  }

  async function salvarMaterial() {
    setSalvando(true)
    setMensagem('')
    const { data: existing } = await supabase.from('conteudo_material').select('id').eq('conteudo_id', id).maybeSingle()
    if (existing) {
      await supabase.from('conteudo_material').update({ explicacao, exemplos, atualizado_em: new Date() }).eq('conteudo_id', id)
    } else {
      await supabase.from('conteudo_material').insert({ conteudo_id: id, explicacao, exemplos })
    }
    setMensagem('Salvo com sucesso!')
    setSalvando(false)
  }

  function extrairIdYoutube(url) {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    return match ? match[1] : null
  }

  async function adicionarVideo() {
    if (!tituloVideo || !urlVideo) return
    const youtubeId = extrairIdYoutube(urlVideo)
    if (!youtubeId) { setMensagem('URL do YouTube inválida'); return }
    await supabase.from('conteudo_videos').insert({ conteudo_id: id, titulo: tituloVideo, url_youtube: youtubeId, ordem: videos.length + 1 })
    setTituloVideo(''); setUrlVideo('')
    buscarVideos()
  }

  async function apagarVideo(videoId) {
    await supabase.from('conteudo_videos').delete().eq('id', videoId)
    buscarVideos()
  }

  async function adicionarLista() {
    if (!tituloLista) return
    if (listas.length >= 5) { setMensagem('Máximo de 5 listas por conteúdo'); return }
    await supabase.from('listas').insert({ conteudo_id: id, numero: listas.length + 1, titulo: tituloLista })
    setTituloLista('')
    buscarListas()
  }

  async function apagarLista(listaId) {
    await supabase.from('listas').delete().eq('id', listaId)
    buscarListas()
  }

  if (!conteudo) return <Layout menu={<MenuAdmin />}><p className="text-gray-400">Carregando...</p></Layout>

  return (
    <Layout menu={<MenuAdmin />}>
      <Botao onClick={() => navigate('/admin/conteudos')} variante="secondary">← Voltar</Botao>
      <Titulo>{conteudo.titulo}</Titulo>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <Subtitulo>Explicação</Subtitulo>
        <p className="text-gray-400 text-xs mb-2">Para formulas: $x^2 + 2x + 1$ | Para imagens: clique em "Inserir imagem"</p>
        <TextareaComImagem value={explicacao} onChange={(e) => setExplicacao(e.target.value)} placeholder="Digite a explicação do conteúdo aqui..." />

        <Subtitulo>Exemplos resolvidos</Subtitulo>
        <TextareaComImagem value={exemplos} onChange={(e) => setExemplos(e.target.value)} placeholder="Digite os exemplos resolvidos aqui..." />

        <div className="mt-4">
          <Botao onClick={salvarMaterial} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar explicação e exemplos'}</Botao>
          {mensagem.includes('Erro') || mensagem.includes('inválida') ? <Erro>{mensagem}</Erro> : <Sucesso>{mensagem}</Sucesso>}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <Subtitulo>Vídeos</Subtitulo>
        <div className="flex gap-3 flex-wrap mb-4">
          <Input placeholder="Título do vídeo" value={tituloVideo} onChange={(e) => setTituloVideo(e.target.value)} />
          <Input placeholder="URL do YouTube" value={urlVideo} onChange={(e) => setUrlVideo(e.target.value)} className="w-80" />
          <Botao onClick={adicionarVideo}>Adicionar vídeo</Botao>
        </div>

        {videos.map((v) => (
          <div key={v.id} className="border border-gray-200 rounded-lg p-4 mb-3">
            <p className="font-semibold mb-2">{v.titulo}</p>
            <iframe width="100%" height="315" src={`https://www.youtube.com/embed/${v.url_youtube}`} allowFullScreen className="rounded-lg" />
            <div className="mt-2">
              <Botao onClick={() => apagarVideo(v.id)} variante="danger">Apagar vídeo</Botao>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <Subtitulo>Listas de exercícios ({listas.length}/5)</Subtitulo>
        <div className="flex gap-3 mb-4">
          <Input placeholder="Título da lista (ex: Lista 1 - Básico)" value={tituloLista} onChange={(e) => setTituloLista(e.target.value)} className="w-80" />
          <Botao onClick={adicionarLista} disabled={listas.length >= 5}>Adicionar lista</Botao>
        </div>

        <Tabela cabecalho={['Lista', 'Título', 'Ações']}>
          {listas.map((l) => (
            <tr key={l.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">{l.numero}</td>
              <td className="px-4 py-3 font-medium">{l.titulo}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Botao onClick={() => navigate(`/admin/conteudos/${id}/lista/${l.id}`)} variante="secondary">Editar questões</Botao>
                  <Botao onClick={() => apagarLista(l.id)} variante="danger">Apagar</Botao>
                </div>
              </td>
            </tr>
          ))}
        </Tabela>
      </div>
    </Layout>
  )
}