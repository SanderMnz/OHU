import { useEffect, useState } from 'react'
import MenuProfessor from '../../components/MenuProfessor'
import { supabase } from '../../lib/supabase'

export default function ProfessorExercicios() {
  const [turmas, setTurmas] = useState([])
  const [turmaSelecionada, setTurmaSelecionada] = useState(null)
  const [relatorio, setRelatorio] = useState([])
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

    const { data: alunosData } = await supabase
      .from('turma_aluno')
      .select('usuarios(id, nome)')
      .eq('turma_id', turma.id)
    const alunos = alunosData?.map(a => a.usuarios) || []

    const linhas = await Promise.all(alunos.map(async (aluno) => {
      const { data: tentativas } = await supabase
        .from('tentativas_lista')
        .select('*, listas(titulo, numero, conteudos(titulo))')
        .eq('aluno_id', aluno.id)
        .order('feita_em', { ascending: false })

      const totalListas = tentativas?.length || 0
      const totalAcertos = tentativas?.reduce((acc, t) => acc + t.acertos, 0) || 0
      const listasUnicas = new Set(tentativas.map(t => t.lista_id)).size
      const mediaAcertos = listasUnicas > 0 ? ((totalAcertos / (totalAcertos + tentativas.reduce((acc, t) => acc + (5 - t.acertos), 0))) * 100).toFixed(0) : '-'

      return { aluno, tentativas: tentativas || [], totalListas, mediaAcertos }
    }))

    setRelatorio(linhas)
    setCarregando(false)
  }

  function formatarTempo(s) {
    const min = Math.floor(s / 60).toString().padStart(2, '0')
    const seg = (s % 60).toString().padStart(2, '0')
    return `${min}:${seg}`
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
          <div style={{ marginTop: '20px' }}>
            <table border="1" cellPadding="8" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Listas feitas</th>
                  <th>Media de acertos</th>
                  <th>Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {relatorio.map(({ aluno, tentativas, totalListas, mediaAcertos }) => (
                  <>
                    <tr key={aluno.id}>
                      <td>{aluno.nome}</td>
                      <td>{totalListas}</td>
                      <td>{mediaAcertos === '-' ? '-' : `${mediaAcertos}%`}</td>
                      <td>
                        <button onClick={() => setAlunoExpandido(alunoExpandido === aluno.id ? null : aluno.id)}>
                          {alunoExpandido === aluno.id ? 'Fechar' : 'Ver detalhes'}
                        </button>
                      </td>
                    </tr>
                    {alunoExpandido === aluno.id && (
                      <tr>
                        <td colSpan="4" style={{ background: '#f9f9f9', padding: '15px' }}>
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