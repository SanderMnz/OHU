import { useEffect, useState } from 'react'
import MenuProfessor from '../../components/MenuProfessor'
import { supabase } from '../../lib/supabase'

export default function ProfessorExercicios() {
  const [turmas, setTurmas] = useState([])
  const [turmaSelecionada, setTurmaSelecionada] = useState(null)
  const [relatorio, setRelatorio] = useState([])
  const [conteudos, setConteudos] = useState([])
  const [alunoExpandido, setAlunoExpandido] = useState(null)
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    buscarTurmas()
  }, [])

  async function buscarTurmas() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase
      .from('turma_professor')
      .select('turmas(*)')
      .eq('professor_id', session.user.id)
    setTurmas(data?.map(t => t.turmas) || [])
  }

  async function buscarRelatorio(turma) {
    setTurmaSelecionada(turma)
    setAlunoExpandido(null)
    setCarregando(true)

    const { data: conteudosData } = await supabase
      .from('turma_conteudo')
      .select('conteudos(id, titulo, listas(id, titulo, numero))')
      .eq('turma_id', turma.id)
      .eq('bimestre', turma.periodo_ativo)
      .order('ordem')
    const conteudosLista = (conteudosData || []).map(c => c.conteudos)
    setConteudos(conteudosLista)

    const { data: alunosData } = await supabase
      .from('turma_aluno')
      .select('usuarios(id, nome)')
      .eq('turma_id', turma.id)
    const alunos = alunosData?.map(a => a.usuarios) || []

    const linhas = await Promise.all(alunos.map(async (aluno) => {
      const { data: tentativas } = await supabase
        .from('tentativas_lista')
        .select('lista_id, acertos, numero_tentativa, tempo_segundos, feita_em, listas(titulo, numero, conteudos(titulo))')
        .eq('aluno_id', aluno.id)
        .order('feita_em', { ascending: false })

      const porConteudo = {}
      for (const conteudo of conteudosLista) {
        if (!conteudo) continue
        const listasDoConteudo = conteudo.listas || []
        let listasFeitas_cont = 0

        for (const lista of listasDoConteudo) {
          const tentativasDaLista = tentativas?.filter(t => t.lista_id === lista.id) || []
          if (tentativasDaLista.length > 0) {
            listasFeitas_cont++
          }
        }

        const percentualListas = listasDoConteudo.length > 0
          ? ((listasFeitas_cont / listasDoConteudo.length) * 100).toFixed(0)
          : null

        porConteudo[conteudo.id] = {
          listasFeitas: listasFeitas_cont,
          totalListas: listasDoConteudo.length,
          percentual: percentualListas
        }
      }

      return { aluno, tentativas: tentativas || [], porConteudo }
    }))

    setRelatorio(linhas)
    setCarregando(false)
  }

  function formatarTempo(s) {
    if (!s && s !== 0) return '-'
    const seg = parseInt(s)
    if (isNaN(seg)) return '-'
    const min = Math.floor(seg / 60).toString().padStart(2, '0')
    const seconds = (seg % 60).toString().padStart(2, '0')
    return `${min}:${seconds}`
  }

  return (
    <div style={{ display: 'flex' }}>
      <MenuProfessor />
      <div style={{ padding: '20px', minWidth: '700px' }}>
        <h1>Exercicios dos Alunos</h1>

        <select
          value={turmaSelecionada?.id || ''}
          onChange={(e) => {
            const turma = turmas.find(t => t.id === e.target.value)
            if (turma) buscarRelatorio(turma)
          }}
        >
          <option value="">Selecione a turma</option>
          {turmas.map(t => (
            <option key={t.id} value={t.id}>{t.nome}</option>
          ))}
        </select>

        {carregando && <p>Carregando...</p>}

        {relatorio.length > 0 && (
          <div style={{ marginTop: '20px', overflowX: 'auto' }}>
            <p style={{ fontSize: '13px', color: 'gray' }}>
              🔴 Nenhuma lista feita neste conteudo &nbsp;|&nbsp; 🔵 Mais de 80% das listas feitas
            </p>
            <table border="1" cellPadding="8" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Aluno</th>
                  {conteudos.map(c => (
                    <th key={c.id}>
                      {c.titulo}
                      <br />
                      <small>({c.listas?.length || 0} listas)</small>
                    </th>
                  ))}
                  <th>Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {relatorio.map(({ aluno, tentativas, porConteudo }) => (
                  <>
                    <tr key={aluno.id}>
                      <td>{aluno.nome}</td>
                      {conteudos.map(c => {
                        const pc = porConteudo[c.id]
                        const corCelula = !pc || pc.listasFeitas === 0
                          ? '#fee2e2'
                          : pc.percentual !== null && parseInt(pc.percentual) >= 80
                            ? '#dbeafe'
                            : 'white'
                        return (
                          <td key={c.id} style={{ textAlign: 'center', background: corCelula }}>
                            {pc && pc.listasFeitas > 0 ? (
                              <>
                                <div>{pc.listasFeitas}/{pc.totalListas} listas</div>
                                <div style={{ fontSize: '12px', color: 'gray' }}>
                                  {pc.percentual !== null ? `${pc.percentual}%` : '-'}
                                </div>
                              </>
                            ) : (
                              <div>0/{c.listas?.length || 0} listas</div>
                            )}
                          </td>
                        )
                      })}
                      <td>
                        <button onClick={() => setAlunoExpandido(alunoExpandido === aluno.id ? null : aluno.id)}>
                          {alunoExpandido === aluno.id ? 'Fechar' : 'Ver detalhes'}
                        </button>
                      </td>
                    </tr>
                    {alunoExpandido === aluno.id && (
                      <tr key={`${aluno.id}-detalhes`}>
                        <td colSpan={conteudos.length + 2} style={{ background: '#f9f9f9', padding: '15px' }}>
                          {tentativas.length === 0 ? (
                            <p>Este aluno ainda nao fez nenhum exercicio.</p>
                          ) : (
                            <table border="1" cellPadding="6" style={{ width: '100%' }}>
                              <thead>
                                <tr>
                                  <th>Conteudo</th>
                                  <th>Lista</th>
                                  <th>Tentativa</th>
                                  <th>Acertos</th>
                                  <th>Tempo</th>
                                  <th>Data</th>
                                </tr>
                              </thead>
                              <tbody>
                                {tentativas.map(t => (
                                  <tr key={t.id}>
                                    <td>{t.listas?.conteudos?.titulo || '-'}</td>
                                    <td>{t.listas?.titulo || '-'}</td>
                                    <td>{t.numero_tentativa}</td>
                                    <td>{t.acertos}/5</td>
                                    <td>{formatarTempo(t.tempo_segundos)}</td>
                                    <td>{new Date(t.feita_em).toLocaleDateString('pt-BR')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}