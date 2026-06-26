import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MenuAdmin from '../../components/MenuAdmin'
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
    const { data } = await supabase
      .from('conteudos')
      .select('*')
      .order('ordem')
    setConteudos(data || [])
  }

  useEffect(() => {
    buscarConteudos()
  }, [])

  async function cadastrarConteudo() {
    setErro('')
    if (!titulo || !ordem) {
      setErro('Preencha titulo e ordem')
      return
    }

    setCarregando(true)
    const { error } = await supabase
      .from('conteudos')
      .insert({ titulo, descricao, ordem: parseInt(ordem) })

    if (error) {
      setErro('Erro ao cadastrar conteudo')
    } else {
      setTitulo('')
      setDescricao('')
      setOrdem('')
      buscarConteudos()
    }
    setCarregando(false)
  }

  async function apagarConteudo(id) {
    await supabase.from('conteudos').delete().eq('id', id)
    buscarConteudos()
  }

  return (
    <div style={{ display: 'flex' }}>
      <MenuAdmin />
      <div style={{ padding: '20px' }}>
        <h1>Conteudos</h1>

        <h2>Cadastrar novo conteudo</h2>
        <input
          placeholder="Titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
        <input
          placeholder="Descricao (opcional)"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
        <input
          placeholder="Ordem (1, 2, 3...)"
          type="number"
          value={ordem}
          onChange={(e) => setOrdem(e.target.value)}
        />
        <button onClick={cadastrarConteudo} disabled={carregando}>
          {carregando ? 'Salvando...' : 'Cadastrar'}
        </button>
        {erro && <p style={{ color: 'red' }}>{erro}</p>}

        <h2>Conteudos cadastrados</h2>
        {conteudos.length === 0 && <p>Nenhum conteudo cadastrado ainda.</p>}
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Ordem</th>
              <th>Titulo</th>
              <th>Descricao</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {conteudos.map((c) => (
              <tr key={c.id}>
                <td>{c.ordem}</td>
                <td>{c.titulo}</td>
                <td>{c.descricao || '-'}</td>
                <td>
                  <button onClick={() => navigate(`/admin/conteudos/${c.id}`)}>Editar</button>
                  <button onClick={() => apagarConteudo(c.id)}>Apagar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}