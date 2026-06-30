import { useEffect, useState } from 'react'
import MenuProfessor from '../../components/MenuProfessor'
import Layout from '../../components/Layout'
import { Titulo, Select, Botao } from '../../components/UI'
import { supabase } from '../../lib/supabase'

export default function ProfessorExercicios() {
  const [turmas, setTurmas] = useState([])
  const [turmaSelecionada, setTurmaSelecionada] = useState(null)
  const [relatorio, setRelatorio] = useState([])
  const [conteudos, setConteudos] = useState([])
  const [alunoExpandido, setAlunoExpandido] = useState(null)
  const [carregando, setCarregando] = useState(false)

  useEffect(() => { buscarTurmas() }, [])

  async function buscarTurmas() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase.from('turma_professor').select('turmas(*)').eq('professor_id', session.user.id)
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

    const { data: alunosData } = await supabase.from('turma_aluno').select('usuarios(id, nome)').eq('turma_id', turma.id)
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
          if (tentativasDaLista.length > 0) listasFeitas_cont++
        }
        const percentualListas = listasDoConteudo.length > 0 ? ((listasFeitas_cont / listasDoConteudo.length) * 100).toFixed(0) : null
        porConteudo[conteudo.id] = { listasFeitas: listasFeitas_cont, totalListas: listasDoConteudo.length, percentual: percentualListas }
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
    <Layout menu={<MenuProfessor />}>
      <Titulo>Exercicios dos Alunos</Titulo>

      <Select
        value={turmaSelecionada?.id || ''}
        onChange={(e) => { const turma = turmas.find(t => t.id === e.target.value); if (turma) buscarRelatorio(turma) }}
      >
        <option value="">Selecione a turma</option>
        {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
      </Select>

      {carregando && <p className="text-gray-400 mt-4">Carregando...</p>}

      {relatorio.length > 0 && (
        <div className="mt-6">
          <p className="text-xs text-gray-400 mb-3">🔴 Nenhuma lista feita neste conteudo &nbsp;|&nbsp; 🔵 Mais de 80% das listas feitas</p>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Aluno</th>
                  {conteudos.map(c => (
                    <th key={c.id} className="px-4 py-3 text-center">{c.titulo}<br /><span className="font-normal normal-case">({c.listas?.length || 0} listas)</span></th>
                  ))}
                  <th className="px-4 py-3 text-center">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {relatorio.map(({ aluno, tentativas, porConteudo }) => (
                  <>
                    <tr key={aluno.id}>
                      <td className="px-4 py-3 font-medium">{aluno.nome}</td>
                      {conteudos.map(c => {
                        const pc = porConteudo[c.id]
                        const corCelula = !pc || pc.listasFeitas === 0
                          ? 'bg-red-50'
                          : pc.percentual !== null && parseInt(pc.percentual) >= 80 ? 'bg-blue-50' : ''
                        return (
                          <td key={c.id} className={`px-4 py-3 text-center ${corCelula}`}>
                            {pc && pc.listasFeitas > 0 ? (
                              <>
                                <div>{pc.listasFeitas}/{pc.totalListas} listas</div>
                                <div className="text-xs text-gray-400">{pc.percentual !== null ? `${pc.percentual}%` : '-'}</div>
                              </>
                            ) : <div className="text-gray-500">0/{c.listas?.length || 0} listas</div>}
                          </td>
                        )
                      })}
                      <td className="px-4 py-3 text-center">
                        <Botao onClick={() => setAlunoExpandido(alunoExpandido === aluno.id ? null : aluno.id)} variante="secondary">
                          {alunoExpandido === aluno.id ? 'Fechar' : 'Ver detalhes'}
                        </Botao>
                      </td>
                    </tr>
                    {alunoExpandido === aluno.id && (
                      <tr key={`${aluno.id}-detalhes`}>
                        <td colSpan={conteudos.length + 2} className="bg-gray-50 p-4">
                          {tentativas.length === 0 ? (
                            <p className="text-gray-400">Este aluno ainda nao fez nenhum exercicio.</p>
                          ) : (
                            <table className="w-full text-sm bg-white rounded-lg overflow-hidden border border-gray-200">
                              <thead className="bg-gray-100 text-xs uppercase text-gray-500">
                                <tr>
                                  <th className="px-3 py-2 text-left">Conteudo</th>
                                  <th className="px-3 py-2 text-left">Lista</th>
                                  <th className="px-3 py-2 text-center">Tentativa</th>
                                  <th className="px-3 py-2 text-center">Acertos</th>
                                  <th className="px-3 py-2 text-center">Tempo</th>
                                  <th className="px-3 py-2 text-center">Data</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {tentativas.map(t => (
                                  <tr key={t.id}>
                                    <td className="px-3 py-2">{t.listas?.conteudos?.titulo || '-'}</td>
                                    <td className="px-3 py-2">{t.listas?.titulo || '-'}</td>
                                    <td className="px-3 py-2 text-center">{t.numero_tentativa}</td>
                                    <td className="px-3 py-2 text-center">{t.acertos}/5</td>
                                    <td className="px-3 py-2 text-center">{formatarTempo(t.tempo_segundos)}</td>
                                    <td className="px-3 py-2 text-center">{new Date(t.feita_em).toLocaleDateString('pt-BR')}</td>
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
        </div>
      )}
    </Layout>
  )
}