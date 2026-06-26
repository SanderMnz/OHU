import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MenuAdmin from '../../components/MenuAdmin'
import { supabase } from '../../lib/supabase'

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
    const { data } = await supabase
      .from('conteudos')
      .select('*')
      .eq('id', id)
      .single()
    setConteudo(data)
  }

  async function buscarMaterial() {
    const { data } = await supabase
      .from('conteudo_material')
      .select('*')
      .eq('conteudo_id', id)
      .single()
    if (data) {
      setExplicacao(data.explicacao || '')
      setExemplos(data.exemplos || '')
    }
  }

  async function buscarVideos() {
    const { data } = await supabase
      .from('conteudo_videos')
      .select('*')
      .eq('conteudo_id', id)
      .order('ordem')
    setVideos(data || [])
  }

  async function buscarListas() {
    const { data } = await supabase
      .from('listas')
      .select('*')
      .eq('conteudo_id', id)
      .order('numero')
    setListas(data || [])
  }

  async function salvarMaterial() {
    setSalvando(true)
    setMensagem('')

    const { data: existing } = await supabase
      .from('conteudo_material')
      .select('id')
      .eq('conteudo_id', id)
      .single()

    if (existing) {
      await supabase
        .from('conteudo_material')
        .update({ explicacao, exemplos, atualizado_em: new Date() })
        .eq('conteudo_id', id)
    } else {
      await supabase
        .from('conteudo_material')
        .insert({ conteudo_id: id, explicacao, exemplos })
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
    if (!youtubeId) {
      setMensagem('URL do YouTube invalida')
      return
    }

    await supabase.from('conteudo_videos').insert({
      conteudo_id: id,
      titulo: tituloVideo,
      url_youtube: youtubeId,
      ordem: videos.length + 1
    })

    setTituloVideo('')
    setUrlVideo('')
    buscarVideos()
  }

  async function apagarVideo(videoId) {
    await supabase.from('conteudo_videos').delete().eq('id', videoId)
    buscarVideos()
  }

  async function adicionarLista() {
    if (!tituloLista) return
    if (listas.length >= 5) {
      setMensagem('Maximo de 5 listas por conteudo')
      return
    }

    await supabase.from('listas').insert({
      conteudo_id: id,
      numero: listas.length + 1,
      titulo: tituloLista
    })

    setTituloLista('')
    buscarListas()
  }

  async function apagarLista(listaId) {
    await supabase.from('listas').delete().eq('id', listaId)
    buscarListas()
  }

  if (!conteudo) return <p>Carregando...</p>

  return (
    <div style={{ display: 'flex' }}>
      <MenuAdmin />
      <div style={{ padding: '20px', maxWidth: '800px' }}>
        <button onClick={() => navigate('/admin/conteudos')}>Voltar</button>
        <h1>{conteudo.titulo}</h1>

        <h2>Explicacao</h2>
        <p style={{ color: 'gray', fontSize: '12px' }}>
          Para formulas use: $x^2 + 2x + 1$ (entre cifraos)
        </p>
        <textarea
          rows={10}
          style={{ width: '100%' }}
          placeholder="Digite a explicacao do conteudo aqui..."
          value={explicacao}
          onChange={(e) => setExplicacao(e.target.value)}
        />

        <h2>Exemplos resolvidos</h2>
        <textarea
          rows={10}
          style={{ width: '100%' }}
          placeholder="Digite os exemplos resolvidos aqui..."
          value={exemplos}
          onChange={(e) => setExemplos(e.target.value)}
        />

        <button onClick={salvarMaterial} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar explicacao e exemplos'}
        </button>
        {mensagem && <p style={{ color: 'green' }}>{mensagem}</p>}

        <hr />

        <h2>Videos</h2>
        <input
          placeholder="Titulo do video"
          value={tituloVideo}
          onChange={(e) => setTituloVideo(e.target.value)}
        />
        <input
          placeholder="URL do YouTube"
          value={urlVideo}
          onChange={(e) => setUrlVideo(e.target.value)}
          style={{ width: '400px' }}
        />
        <button onClick={adicionarVideo}>Adicionar video</button>

        {videos.map((v) => (
          <div key={v.id} style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}>
            <p><strong>{v.titulo}</strong></p>
            <iframe
              width="560"
              height="315"
              src={`https://www.youtube.com/embed/${v.url_youtube}`}
              allowFullScreen
            />
            <br />
            <button onClick={() => apagarVideo(v.id)}>Apagar video</button>
          </div>
        ))}

        <hr />

        <h2>Listas de exercicios ({listas.length}/5)</h2>
        <input
          placeholder="Titulo da lista (ex: Lista 1 - Basico)"
          value={tituloLista}
          onChange={(e) => setTituloLista(e.target.value)}
        />
        <button onClick={adicionarLista} disabled={listas.length >= 5}>
          Adicionar lista
        </button>

        <table border="1" cellPadding="8" style={{ marginTop: '10px' }}>
          <thead>
            <tr>
              <th>Lista</th>
              <th>Titulo</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {listas.map((l) => (
              <tr key={l.id}>
                <td>{l.numero}</td>
                <td>{l.titulo}</td>
                <td>
                  <button onClick={() => navigate(`/admin/conteudos/${id}/lista/${l.id}`)}>
                    Editar questoes
                  </button>
                  <button onClick={() => apagarLista(l.id)}>Apagar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}