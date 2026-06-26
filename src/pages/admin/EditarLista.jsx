import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MenuAdmin from '../../components/MenuAdmin'
import { supabase } from '../../lib/supabase'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

export default function EditarLista() {
  const { id, listaId } = useParams()
  const navigate = useNavigate()

  const [lista, setLista] = useState(null)
  const [questoes, setQuestoes] = useState([])
  const [enunciado, setEnunciado] = useState('')
  const [alternativas, setAlternativas] = useState(['', '', '', ''])
  const [respostaCorreta, setRespostaCorreta] = useState('')
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    buscarLista()
    buscarQuestoes()
  }, [])

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
  }

  async function adicionarQuestao() {
    setMensagem('')

    if (!enunciado || alternativas.some(a => !a) || !respostaCorreta) {
      setMensagem('Preencha o enunciado, todas as alternativas e a resposta correta')
      return
    }

    if (questoes.length >= 5) {
      setMensagem('Maximo de 5 questoes por lista')
      return
    }

    if (!['A', 'B', 'C', 'D'].includes(respostaCorreta.toUpperCase())) {
      setMensagem('Resposta correta deve ser A, B, C ou D')
      return
    }

    await supabase.from('questoes').insert({
      lista_id: listaId,
      enunciado,
      alternativas: {
        A: alternativas[0],
        B: alternativas[1],
        C: alternativas[2],
        D: alternativas[3]
      },
      resposta_correta: respostaCorreta.toUpperCase(),
      ordem: questoes.length + 1
    })

    setEnunciado('')
    setAlternativas(['', '', '', ''])
    setRespostaCorreta('')
    buscarQuestoes()
  }

  async function apagarQuestao(questaoId) {
    await supabase.from('questoes').delete().eq('id', questaoId)
    buscarQuestoes()
  }
  
function renderizarTexto(texto) {
    if (!texto) return null
    return (
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {texto}
      </ReactMarkdown>
    )
  }

  if (!lista) return <p>Carregando...</p>

  return (
    <div style={{ display: 'flex' }}>
      <MenuAdmin />
      <div style={{ padding: '20px', maxWidth: '800px' }}>
        <button onClick={() => navigate(`/admin/conteudos/${id}`)}>Voltar</button>
        <h1>{lista.titulo}</h1>
        <p>Questoes: {questoes.length}/5</p>

        {questoes.length < 5 && (
          <div>
            <h2>Adicionar questao</h2>
            <textarea
              rows={4}
              style={{ width: '100%' }}
              placeholder="Enunciado da questao..."
              value={enunciado}
              onChange={(e) => setEnunciado(e.target.value)}
            />

            <h3>Alternativas</h3>
            {['A', 'B', 'C', 'D'].map((letra, i) => (
              <div key={letra}>
                <label>{letra}:</label>
                <input
                  style={{ width: '500px' }}
                  placeholder={`Alternativa ${letra}`}
                  value={alternativas[i]}
                  onChange={(e) => {
                    const novas = [...alternativas]
                    novas[i] = e.target.value
                    setAlternativas(novas)
                  }}
                />
              </div>
            ))}

            <div style={{ marginTop: '10px' }}>
              <label>Resposta correta: </label>
              <select
                value={respostaCorreta}
                onChange={(e) => setRespostaCorreta(e.target.value)}
              >
                <option value="">Selecione</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>

            <button style={{ marginTop: '10px' }} onClick={adicionarQuestao}>
              Adicionar questao
            </button>
            {mensagem && <p style={{ color: 'red' }}>{mensagem}</p>}
          </div>
        )}

        <hr />

        <h2>Questoes cadastradas</h2>
        {questoes.length === 0 && <p>Nenhuma questao ainda.</p>}
        {questoes.map((q, i) => (
          <div key={q.id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
            <p><strong>Questao {i + 1}:</strong> {renderizarTexto(q.enunciado)}</p>
<p>A: {renderizarTexto(q.alternativas.A)}</p>
<p>B: {renderizarTexto(q.alternativas.B)}</p>
<p>C: {renderizarTexto(q.alternativas.C)}</p>
<p>D: {renderizarTexto(q.alternativas.D)}</p>
            <p><strong>Resposta correta: {q.resposta_correta}</strong></p>
            <button onClick={() => apagarQuestao(q.id)}>Apagar</button>
          </div>
        ))}
      </div>
    </div>
  )
}