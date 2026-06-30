import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import MenuAluno from '../../components/MenuAluno'
import Layout from '../../components/Layout'
import { Titulo, Botao } from '../../components/UI'
import { supabase } from '../../lib/supabase'

export default function AlunoLista() {
  const { listaId } = useParams()
  const navigate = useNavigate()

  const [lista, setLista] = useState(null)
  const [questoes, setQuestoes] = useState([])
  const [respostas, setRespostas] = useState({})
  const [resultado, setResultado] = useState(null)
  const [tempo, setTempo] = useState(0)
  const [rodando, setRodando] = useState(false)
  const [numerotentativa, setNumerotentativa] = useState(1)
  const timerRef = useRef(null)

  useEffect(() => { buscarLista(); buscarQuestoes(); buscarTentativas() }, [])

  useEffect(() => {
    if (rodando) { timerRef.current = setInterval(() => setTempo(t => t + 1), 1000) }
    else clearInterval(timerRef.current)
    return () => clearInterval(timerRef.current)
  }, [rodando])

  async function buscarLista() {
    const { data } = await supabase.from('listas').select('*').eq('id', listaId).single()
    setLista(data)
  }

  async function buscarQuestoes() {
    const { data } = await supabase.from('questoes').select('*').eq('lista_id', listaId).order('ordem')
    setQuestoes(data || [])
    setRodando(true)
  }

  async function buscarTentativas() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase.from('tentativas_lista').select('numero_tentativa').eq('aluno_id', session.user.id).eq('lista_id', listaId).order('numero_tentativa', { ascending: false }).limit(1)
    if (data && data.length > 0) setNumerotentativa(data[0].numero_tentativa + 1)
  }

  async function finalizar() {
    setRodando(false)
    let acertos = 0
    questoes.forEach(q => { if (respostas[q.id] === q.resposta_correta) acertos++ })

    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      await supabase.from('tentativas_lista').insert({ aluno_id: session.user.id, lista_id: listaId, numero_tentativa: numerotentativa, acertos, tempo_segundos: tempo })
    }
    setResultado({ acertos, total: questoes.length, tempo })
  }

  function formatarTempo(s) {
    const min = Math.floor(s / 60).toString().padStart(2, '0')
    const seg = (s % 60).toString().padStart(2, '0')
    return `${min}:${seg}`
  }

  function renderizar(texto) {
    if (!texto) return null
    return <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{texto}</ReactMarkdown>
  }

  if (!lista) return <Layout menu={<MenuAluno />}><p className="text-gray-400">Carregando...</p></Layout>

  if (resultado) {
    return (
      <Layout menu={<MenuAluno />}>
        <Titulo>Resultado</Titulo>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-md">
          <p className="text-lg mb-2">Acertos: <span className="font-bold text-blue-600">{resultado.acertos} de {resultado.total}</span></p>
          <p className="text-gray-600 mb-2">Tempo: {formatarTempo(resultado.tempo)}</p>
          <p className="text-gray-600 mb-6">Tentativa: {numerotentativa}</p>
          <div className="flex gap-3">
            <Botao onClick={() => { setRespostas({}); setResultado(null); setTempo(0); setNumerotentativa(n => n + 1); setRodando(true) }}>
              Tentar novamente
            </Botao>
            <Botao onClick={() => navigate(-1)} variante="secondary">Voltar</Botao>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout menu={<MenuAluno />}>
      <Botao onClick={() => navigate(-1)} variante="secondary">← Voltar</Botao>
      <Titulo>{lista.titulo}</Titulo>

      <div className="sticky top-0 bg-gray-50 py-3 mb-6 border-b border-gray-200 flex gap-6 z-10">
        <span className="font-bold text-blue-600">⏱ {formatarTempo(tempo)}</span>
        <span className="text-gray-500">Tentativa {numerotentativa}</span>
      </div>

      {questoes.map((q, i) => (
        <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
          <p className="font-semibold text-gray-800 mb-2">Questão {i + 1}</p>
          {renderizar(q.enunciado)}

          <div className="mt-4 space-y-2">
            {['A', 'B', 'C', 'D'].map(letra => (
              <label
                key={letra}
                className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition ${respostas[q.id] === letra ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <input
                  type="radio"
                  name={q.id}
                  value={letra}
                  checked={respostas[q.id] === letra}
                  onChange={() => setRespostas({ ...respostas, [q.id]: letra })}
                  className="mt-1"
                />
                <div><strong>{letra}:</strong> {renderizar(q.alternativas[letra])}</div>
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-4">
        <Botao onClick={finalizar} disabled={Object.keys(respostas).length < questoes.length}>Finalizar</Botao>
        {Object.keys(respostas).length < questoes.length && (
          <p className="text-gray-400 text-sm mt-2">Responda todas as questões para finalizar</p>
        )}
      </div>
    </Layout>
  )
}