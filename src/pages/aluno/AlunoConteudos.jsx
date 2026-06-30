import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MenuAluno from '../../components/MenuAluno'
import Layout from '../../components/Layout'
import { Titulo, Botao } from '../../components/UI'
import { supabase } from '../../lib/supabase'

export default function AlunoConteudos() {
  const [conteudos, setConteudos] = useState([])
  const [turma, setTurma] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { buscarTurmaEConteudos() }, [])

  async function buscarTurmaEConteudos() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: turmaAluno } = await supabase.from('turma_aluno').select('turmas(*)').eq('aluno_id', session.user.id).single()
    if (!turmaAluno) return
    setTurma(turmaAluno.turmas)

    const { data } = await supabase
      .from('turma_conteudo')
      .select('conteudos(*)')
      .eq('turma_id', turmaAluno.turmas.id)
      .eq('bimestre', turmaAluno.turmas.periodo_ativo)
      .order('ordem')

    setConteudos(data?.map(c => c.conteudos) || [])
  }

  return (
    <Layout menu={<MenuAluno />}>
      <Titulo>Conteúdos</Titulo>
      {turma && <p className="text-gray-500 mb-6">Turma: {turma.nome} — {turma.tipo === 'eja' ? 'Trimestre' : 'Bimestre'} {turma.periodo_ativo}</p>}

      {conteudos.length === 0 && <p className="text-gray-400">Nenhum conteúdo disponível ainda.</p>}

      <div className="grid grid-cols-2 gap-4">
        {conteudos.map(c => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800">{c.titulo}</h2>
            {c.descricao && <p className="text-gray-500 text-sm mt-1">{c.descricao}</p>}
            <div className="mt-4">
              <Botao onClick={() => navigate(`/aluno/conteudo/${c.id}`)}>Acessar conteúdo</Botao>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}