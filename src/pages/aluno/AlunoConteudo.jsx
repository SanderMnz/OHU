import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import MenuAluno from '../../components/MenuAluno'
import { supabase } from '../../lib/supabase'

export default function AlunoConteudo() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [conteudo, setConteudo] = useState(null)
  const [material, setMaterial] = useState(null)
  const [videos, setVideos] = useState([])
  const [listas, setListas] = useState([])
  const [aba, setAba] = useState('explicacao')

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
      .maybeSingle()
    setMaterial(data)
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

  if (!conteudo) return <p>Carregando...</p>

  return (
    <div style={{ display: 'flex' }}>
      <MenuAluno />
      <div style={{ padding: '20px', maxWidth: '800px' }}>
        <button onClick={() => navigate('/aluno/conteudos')}>Voltar</button>
        <h1>{conteudo.titulo}</h1>

        <div style={{ marginBottom: '15px' }}>
          <button onClick={() => setAba('explicacao')} style={{ marginRight: '5px', fontWeight: aba === 'explicacao' ? 'bold' : 'normal' }}>Explicacao</button>
          <button onClick={() => setAba('exemplos')} style={{ marginRight: '5px', fontWeight: aba === 'exemplos' ? 'bold' : 'normal' }}>Exemplos</button>
          <button onClick={() => setAba('videos')} style={{ marginRight: '5px', fontWeight: aba === 'videos' ? 'bold' : 'normal' }}>Videos</button>
          <button onClick={() => setAba('exercicios')} style={{ fontWeight: aba === 'exercicios' ? 'bold' : 'normal' }}>Exercicios</button>
        </div>

        {aba === 'explicacao' && (
          <div>
            {material?.explicacao ? (
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {material.explicacao}
              </ReactMarkdown>
            ) : (
              <p>Nenhuma explicacao disponivel ainda.</p>
            )}
          </div>
        )}

        {aba === 'exemplos' && (
          <div>
            {material?.exemplos ? (
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {material.exemplos}
              </ReactMarkdown>
            ) : (
              <p>Nenhum exemplo disponivel ainda.</p>
            )}
          </div>
        )}

        {aba === 'videos' && (
          <div>
            {videos.length === 0 && <p>Nenhum video disponivel ainda.</p>}
            {videos.map(v => (
              <div key={v.id} style={{ marginBottom: '20px' }}>
                <h3>{v.titulo}</h3>
                <iframe
                  width="560"
                  height="315"
                  src={`https://www.youtube.com/embed/${v.url_youtube}`}
                  allowFullScreen
                />
              </div>
            ))}
          </div>
        )}

        {aba === 'exercicios' && (
          <div>
            {listas.length === 0 && <p>Nenhuma lista disponivel ainda.</p>}
            {listas.map(l => (
              <div key={l.id} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '10px' }}>
                <h3>Lista {l.numero} — {l.titulo}</h3>
                <button onClick={() => navigate(`/aluno/lista/${l.id}`)}>
                  Fazer exercicios
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}