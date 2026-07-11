import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MenuAdmin from '../../components/MenuAdmin'
import Layout from '../../components/Layout'
import { Titulo, Botao, Select, Erro } from '../../components/UI'
import { supabase } from '../../lib/supabase'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
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
      <div className="mb-2">
        <button type="button" onClick={() => inputRef.current.click()} disabled={uploadando} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg transition">
          {uploadando ? 'Enviando...' : '📷 Imagem'}
        </button>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      </div>
      {multiline ? (
        <textarea ref={ref} rows={4} className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input ref={ref} className="w-full max-w-xl border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
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

  useEffect(() => { buscarLista(); buscarQuestoes() }, [])

  async function buscarLista() {
    const { data } = await supabase.from('listas').select('*').eq('id', listaId).maybeSingle()
    setLista(data)
  }

  async function buscarQuestoes() {
    const { data } = await supabase.from('questoes').select('*').eq('lista_id', listaId).order('ordem')
    setQuestoes(data || [])
  }

  async function adicionarQuestao() {
    setMensagem('')
    if (!enunciado || alternativas.some(a => !a) || !respostaCorreta) { setMensagem('Preencha o enunciado, todas as alternativas e a resposta correta'); return }
    if (questoes.length >= 5) { setMensagem('Máximo de 5 questões por lista'); return }
    if (!['A', 'B', 'C', 'D'].includes(respostaCorreta.toUpperCase())) { setMensagem('Resposta correta deve ser A, B, C ou D'); return }

    await supabase.from('questoes').insert({
      lista_id: listaId,
      enunciado,
      alternativas: { A: alternativas[0], B: alternativas[1], C: alternativas[2], D: alternativas[3] },
      resposta_correta: respostaCorreta.toUpperCase(),
      ordem: questoes.length + 1
    })

    setEnunciado(''); setAlternativas(['', '', '', '']); setRespostaCorreta('')
    buscarQuestoes()
  }

  async function apagarQuestao(questaoId) {
    await supabase.from('questoes').delete().eq('id', questaoId)
    buscarQuestoes()
  }

  function renderizarTexto(texto) {
    if (!texto) return null
    return <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{texto}</ReactMarkdown>
  }

  if (!lista) return <Layout menu={<MenuAdmin />}><p className="text-gray-400">Carregando...</p></Layout>

  return (
    <Layout menu={<MenuAdmin />}>
      <Botao onClick={() => navigate(`/admin/conteudos/${id}`)} variante="secondary">← Voltar</Botao>
      <Titulo>{lista.titulo}</Titulo>
      <p className="text-gray-500 mb-4">Questões: {questoes.length}/5</p>

      {questoes.length < 5 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">Adicionar questão</h3>

          <p className="text-sm text-gray-500 mb-1">Enunciado</p>
          <InputComImagem value={enunciado} onChange={setEnunciado} placeholder="Enunciado da questão..." multiline />

          <h3 className="font-semibold text-gray-700 mt-4 mb-3">Alternativas</h3>
          {['A', 'B', 'C', 'D'].map((letra, i) => (
            <div key={letra} className="mb-3">
              <label className="text-sm font-medium text-gray-600">{letra}:</label>
              <InputComImagem
                value={alternativas[i]}
                onChange={(val) => { const novas = [...alternativas]; novas[i] = val; setAlternativas(novas) }}
                placeholder={`Alternativa ${letra}`}
                multiline={false}
              />
            </div>
          ))}

          <div className="mt-3 flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Resposta correta:</label>
            <Select value={respostaCorreta} onChange={(e) => setRespostaCorreta(e.target.value)}>
              <option value="">Selecione</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </Select>
          </div>

          <div className="mt-4">
            <Botao onClick={adicionarQuestao}>Adicionar questão</Botao>
            <Erro>{mensagem}</Erro>
          </div>
        </div>
      )}

      <h3 className="font-semibold text-gray-700 mb-3">Questões cadastradas</h3>
      {questoes.length === 0 && <p className="text-gray-400">Nenhuma questão ainda.</p>}
      {questoes.map((q, i) => (
        <div key={q.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
          <p className="font-semibold mb-1">Questão {i + 1}:</p>
          {renderizarTexto(q.enunciado)}
          <div className="mt-2 space-y-1 text-sm">
            <p>A: {renderizarTexto(q.alternativas.A)}</p>
            <p>B: {renderizarTexto(q.alternativas.B)}</p>
            <p>C: {renderizarTexto(q.alternativas.C)}</p>
            <p>D: {renderizarTexto(q.alternativas.D)}</p>
          </div>
          <p className="font-semibold text-green-600 mt-2">Resposta correta: {q.resposta_correta}</p>
          <div className="mt-2">
            <Botao onClick={() => apagarQuestao(q.id)} variante="danger">Apagar</Botao>
          </div>
        </div>
      ))}
    </Layout>
  )
}