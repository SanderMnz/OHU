import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MenuAdmin from '../../components/MenuAdmin'
import Layout from '../../components/Layout'
import { Titulo, Subtitulo, Botao, Input, Tabela, Erro } from '../../components/UI'
import { supabase } from '../../lib/supabase'

export default function Conteudos() {
  const [conteudos, setConteudos] = useState([])
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [ordem, setOrdem] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const navigate = useNavigate()

  async function buscarConteudos() {
    const { data } = await supabase.from('conteudos').select('*').order('ordem')
    setConteudos(data || [])
  }

  useEffect(() => { buscarConteudos() }, [])

  async function cadastrarConteudo() {
    setErro('')
    if (!titulo || !ordem) { setErro('Preencha título e ordem'); return }
    setCarregando(true)
    const { error } = await supabase.from('conteudos').insert({ titulo, descricao, ordem: parseInt(ordem) })
    if (error) { setErro('Erro ao cadastrar conteúdo') } else { setTitulo(''); setDescricao(''); setOrdem(''); buscarConteudos() }
    setCarregando(false)
  }

  async function apagarConteudo(id) {
    await supabase.from('conteudos').delete().eq('id', id)
    buscarConteudos()
  }

  return (
    <Layout menu={<MenuAdmin />}>
      <Titulo>Conteúdos</Titulo>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <Subtitulo>Cadastrar novo conteúdo</Subtitulo>
        <div className="flex gap-3 flex-wrap">
          <Input placeholder="Título (ex: Equações do 1 grau)" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-72" />
          <Input placeholder="Descrição (opcional)" value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-64" />
          <Input placeholder="Ordem (1, 2, 3...)" type="number" value={ordem} onChange={(e) => setOrdem(e.target.value)} className="w-32" />
          <Botao onClick={cadastrarConteudo} disabled={carregando}>{carregando ? 'Salvando...' : 'Cadastrar'}</Botao>
        </div>
        <Erro>{erro}</Erro>
      </div>

      <Subtitulo>Conteúdos cadastrados</Subtitulo>
      {conteudos.length === 0 && <p className="text-gray-400">Nenhum conteúdo cadastrado ainda.</p>}
      <Tabela cabecalho={['Ordem', 'Título', 'Descrição', 'Ações']}>
        {conteudos.map(c => (
          <tr key={c.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 text-gray-500">{c.ordem}</td>
            <td className="px-4 py-3 font-medium">{c.titulo}</td>
            <td className="px-4 py-3 text-gray-500">{c.descricao || '-'}</td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <Botao onClick={() => navigate(`/admin/conteudos/${c.id}`)} variante="secondary">Editar</Botao>
                <Botao onClick={() => apagarConteudo(c.id)} variante="danger">Apagar</Botao>
              </div>
            </td>
          </tr>
        ))}
      </Tabela>
    </Layout>
  )
}