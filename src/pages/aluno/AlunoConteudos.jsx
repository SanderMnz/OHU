import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MenuAluno from '../../components/MenuAluno'
import { supabase } from '../../lib/supabase'

export default function AlunoConteudos() {
  const [conteudos, setConteudos] = useState([])
  const [turma, setTurma] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    buscarTurmaEConteudos()
  }, [])

  async function buscarTurmaEConteudos() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: turmaAluno } = await supabase
      .from('turma_aluno')
      .select('turmas(*)')
      .eq('aluno_id', session.user.id)
      .single()

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
    <div style={{ display: 'flex' }}>
      <MenuAluno />
      <div style={{ padding: '20px' }}>
        <h1>Conteudos</h1>
        {turma && (
          <p>Turma: {turma.nome} — {turma.tipo === 'eja' ? 'Trimestre' : 'Bimestre'} {turma.periodo_ativo}</p>
        )}

        {conteudos.length === 0 && <p>Nenhum conteudo disponivel ainda.</p>}

        {conteudos.map(c => (
          <div key={c.id} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '10px' }}>
            <h2>{c.titulo}</h2>
            {c.descricao && <p>{c.descricao}</p>}
            <button onClick={() => navigate(`/aluno/conteudo/${c.id}`)}>
              Acessar conteudo
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}