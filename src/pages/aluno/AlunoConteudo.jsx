import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import MenuAluno from '../../components/MenuAluno'
import Layout from '../../components/Layout'
import { Titulo, Botao } from '../../components/UI'
import { supabase } from '../../lib/supabase'

export default function AlunoConteudo() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [conteudo, setConteudo] = useState(null)
  const [material, setMaterial] = useState(null)
  const [videos, setVideos] = useState([])
  const [listas, setListas] = useState([])
  const [aba, setAba] = useState('explicacao')

  useEffect(() => { buscarConteudo(); buscarMaterial(); buscarVideos(); buscarListas() }, [])

  async function buscarConteudo() {
    const { data } = await supabase.from('conteudos').select('*').eq('id', id).single()
    setConteudo(data)
  }

  async function buscarMaterial() {
    const { data } = await supabase.from('conteudo_material').select('*').eq('conteudo_id', id).maybeSingle()
    setMaterial(data)
  }

  async function buscarVideos() {
    const { data } = await supabase.from('conteudo_videos').select('*').eq('conteudo_id', id).order('ordem')
    setVideos(data || [])
  }

  async function buscarListas() {
    const { data } = await supabase.from('listas').select('*').eq('conteudo_id', id).order('numero')
    setListas(data || [])
  }

  if (!conteudo) return <Layout menu={<MenuAluno />}><p className="text-gray-400">Carregando...</p></Layout>

  const abas = [
    { id: 'explicacao', label: 'Explicação' },
    { id: 'exemplos', label: 'Exemplos' },
    { id: 'videos', label: 'Vídeos' },
    { id: 'exercicios', label: 'Exercícios' },
  ]

  return (
    <Layout menu={<MenuAluno />}>
      <Botao onClick={() => navigate('/aluno/conteudos')} variante="secondary">← Voltar</Botao>
      <Titulo>{conteudo.titulo}</Titulo>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {abas.map(a => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={`px-4 py-2 font-medium text-sm transition border-b-2 ${aba === a.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {aba === 'explicacao' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 prose max-w-none">
          {material?.explicacao
            ? <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{material.explicacao}</ReactMarkdown>
            : <p className="text-gray-400">Nenhuma explicação disponível ainda.</p>}
        </div>
      )}

      {aba === 'exemplos' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 prose max-w-none">
          {material?.exemplos
            ? <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{material.exemplos}</ReactMarkdown>
            : <p className="text-gray-400">Nenhum exemplo disponível ainda.</p>}
        </div>
      )}

      {aba === 'videos' && (
        <div className="space-y-4">
          {videos.length === 0 && <p className="text-gray-400">Nenhum vídeo disponível ainda.</p>}
          {videos.map(v => (
            <div key={v.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-800 mb-3">{v.titulo}</h3>
              <iframe width="100%" height="400" src={`https://www.youtube.com/embed/${v.url_youtube}`} allowFullScreen className="rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {aba === 'exercicios' && (
        <div className="space-y-4">
          {listas.length === 0 && <p className="text-gray-400">Nenhuma lista disponível ainda.</p>}
          {listas.map(l => (
            <div key={l.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Lista {l.numero} — {l.titulo}</h3>
              <Botao onClick={() => navigate(`/aluno/lista/${l.id}`)}>Fazer exercícios</Botao>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}