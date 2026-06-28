import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MenuAdmin from '../../components/MenuAdmin'
import { supabase } from '../../lib/supabase'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

async function uploadImagemSupabase(arquivo) {
  const extensao = arquivo.name.split('.').pop()
  const nomeArquivo = `${Date.now()}.${extensao}`
  const { error } = await supabase.storage.from('ImagensOHU').upload(nomeArquivo, arquivo)
  if (error) { console.log('erro upload:', error); return null }
  const { data } = supabase.storage.from('ImagensOHU').getPublicUrl(nomeArquivo)
  return data.publicUrl
}

function InputComImagem({ value, onChange, placeholder, multiline }) {
  const ref = useRef(null)
  const inputRef = useRef(null)
  const [uploadando, setUploadando] = useState(false)

  async function handleUpload(e) {
    const arquivo = e.target.files[0]
    if (!arquivo) return
    setUploadando(true)
    const url = await uploadImagemSupabase(arquivo)
    if (!url) { alert('Erro ao fazer upload'); setUploadando(false); return }
    const el = ref.current
    const inicio = el.selectionStart
    const fim = el.selectionEnd
    const linkMarkdown = `![imagem](${url})`
    const novoTexto = value.slice(0, inicio) + linkMarkdown + value.slice(fim)
    onChange(novoTexto)
    setUploadando(false)
    e.target.value = ''
  }

  return (
    <div>
      <div style={{ marginBottom: '4px' }}>
        <button type="button" onClick={() => inputRef.current.click()} disabled={uploadando} style={{ fontSize: '12px' }}>
          {uploadando ? 'Enviando...' : '📷 Imagem'}
        </button>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
      </div>
      {multiline ? (
        <textarea
          ref={ref}
          rows={4}
          style={{ width: '100%' }}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          ref={ref}
          style={{ width: '500px' }}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}

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
    const { data } = await supabase.from('listas').select('*').eq('id', listaId).single()
    setLista(data)
  }

  async function buscarQuestoes() {
    const { data } = await supabase.from('questoes').select('*').eq('lista_id', listaId).order('ordem')
    setQuestoes(data || [])
  }

  async function adicionarQuestao() {
    setMensagem('')
    if (!enunciado || alternativas.some(a => !a) || !respostaCorreta) {
      setMensagem('Preencha o enunciado, todas as alternativas e a resposta correta')
      return
    }
    if (questoes.length >= 5) { setMensagem('Maximo de 5 questoes por lista'); return }
    if (!['A', 'B', 'C', 'D'].includes(respostaCorreta.toUpperCase())) {
      setMensagem('Resposta correta deve ser A, B, C ou D')
      return
    }

    await supabase.from('questoes').insert({
      lista_id: listaId,
      enunciado,
      alternativas: { A: alternativas[0], B: alternativas[1], C: alternativas[2], D: alternativas[3] },
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
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
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

            <h3>Enunciado</h3>
            <InputComImagem
              value={enunciado}
              onChange={setEnunciado}
              placeholder="Enunciado da questao..."
              multiline
            />

            <h3>Alternativas</h3>
            {['A', 'B', 'C', 'D'].map((letra, i) => (
              <div key={letra} style={{ marginBottom: '10px' }}>
                <label><strong>{letra}:</strong></label>
                <InputComImagem
                  value={alternativas[i]}
                  onChange={(val) => {
                    const novas = [...alternativas]
                    novas[i] = val
                    setAlternativas(novas)
                  }}
                  placeholder={`Alternativa ${letra}`}
                  multiline={false}
                />
              </div>
            ))}

            <div style={{ marginTop: '10px' }}>
              <label>Resposta correta: </label>
              <select value={respostaCorreta} onChange={(e) => setRespostaCorreta(e.target.value)}>
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
            <p><strong>Questao {i + 1}:</strong></p>
            {renderizarTexto(q.enunciado)}
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