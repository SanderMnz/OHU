import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import MenuAluno from '../../components/MenuAluno'
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

  useEffect(() => {
    buscarLista()
    buscarQuestoes()
    buscarTentativas()
  }, [])

  useEffect(() => {
    if (rodando) {
      timerRef.current = setInterval(() => {
        setTempo(t => t + 1)
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [rodando])

  async function buscarLista() {
    const { data } = await supabase
      .from('listas')
      .select('*')
      .eq('id', listaId)
      .single()
    setLista(data)
  }

  async function buscarQuestoes() {
    const { data } = await supabase
      .from('questoes')
      .select('*')
      .eq('lista_id', listaId)
      .order('ordem')
    setQuestoes(data || [])
    setRodando(true)
  }

  async function buscarTentativas() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase
      .from('tentativas_lista')
      .select('numero_tentativa')
      .eq('aluno_id', session.user.id)
      .eq('lista_id', listaId)
      .order('numero_tentativa', { ascending: false })
      .limit(1)
    if (data && data.length > 0) {
      setNumerotentativa(data[0].numero_tentativa + 1)
    }
  }

  async function finalizar() {
    setRodando(false)

    let acertos = 0
    questoes.forEach(q => {
      if (respostas[q.id] === q.resposta_correta) acertos++
    })

    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      await supabase.from('tentativas_lista').insert({
        aluno_id: session.user.id,
        lista_id: listaId,
        numero_tentativa: numerotentativa,
        acertos,
        tempo_segundos: tempo
      })
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
    return (
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {texto}
      </ReactMarkdown>
    )
  }

  if (!lista) return <p>Carregando...</p>

  if (resultado) {
    return (
      <div style={{ display: 'flex' }}>
        <MenuAluno />
        <div style={{ padding: '20px' }}>
          <h1>Resultado</h1>
          <p>Acertos: {resultado.acertos} de {resultado.total}</p>
          <p>Tempo: {formatarTempo(resultado.tempo)}</p>
          <p>Tentativa: {numerotentativa}</p>
          <button onClick={() => {
            setRespostas({})
            setResultado(null)
            setTempo(0)
            setNumerotentativa(n => n + 1)
            setRodando(true)
          }}>
            Tentar novamente
          </button>
          <button onClick={() => navigate(-1)} style={{ marginLeft: '10px' }}>
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex' }}>
      <MenuAluno />
      <div style={{ padding: '20px', maxWidth: '700px' }}>
        <button onClick={() => navigate(-1)}>Voltar</button>
        <h1>{lista.titulo}</h1>

        <div style={{ position: 'sticky', top: 0, background: 'white', padding: '10px 0', borderBottom: '1px solid #ccc', marginBottom: '20px' }}>
          <strong>Tempo: {formatarTempo(tempo)}</strong>
          <span style={{ marginLeft: '20px' }}>Tentativa {numerotentativa}</span>
        </div>

        {questoes.map((q, i) => (
          <div key={q.id} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '15px' }}>
            <p><strong>Questao {i + 1}</strong></p>
            {renderizar(q.enunciado)}

            {['A', 'B', 'C', 'D'].map(letra => (
              <div key={letra} style={{ margin: '8px 0' }}>
                <label style={{ cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name={q.id}
                    value={letra}
                    checked={respostas[q.id] === letra}
                    onChange={() => setRespostas({ ...respostas, [q.id]: letra })}
                  />
                  <strong> {letra}:</strong> {renderizar(q.alternativas[letra])}
                </label>
              </div>
            ))}
          </div>
        ))}

        <button
          onClick={finalizar}
          disabled={Object.keys(respostas).length < questoes.length}
          style={{ marginTop: '10px' }}
        >
          Finalizar
        </button>
        {Object.keys(respostas).length < questoes.length && (
          <p style={{ color: 'gray' }}>Responda todas as questoes para finalizar</p>
        )}
      </div>
    </div>
  )
}