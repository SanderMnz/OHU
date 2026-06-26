import { useEffect, useState } from 'react'
import MenuProfessor from '../../components/MenuProfessor'
import { supabase } from '../../lib/supabase'

export default function ProfessorNotas() {
  const [turmas, setTurmas] = useState([])
  const [turmaSelecionada, setTurmaSelecionada] = useState('')
  const [bimestre, setBimestre] = useState('')
  const [aba, setAba] = useState('provas')

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

  return (
    <div style={{ display: 'flex' }}>
      <MenuProfessor />
      <div style={{ padding: '20px', minWidth: '700px' }}>
        <h1>Lancamento de Notas</h1>

        <div style={{ marginBottom: '20px' }}>
          <select value={turmaSelecionada} onChange={(e) => setTurmaSelecionada(e.target.value)}>
            <option value="">Selecione a turma</option>
            {turmas.map(t => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>

          <select value={bimestre} onChange={(e) => setBimestre(e.target.value)} style={{ marginLeft: '10px' }}>
            <option value="">Selecione o bimestre</option>
            <option value="1">1 Bimestre</option>
            <option value="2">2 Bimestre</option>
            <option value="3">3 Bimestre</option>
            <option value="4">4 Bimestre</option>
          </select>
        </div>

        {turmaSelecionada && bimestre && (
          <div>
            <div style={{ marginBottom: '10px' }}>
              <button onClick={() => setAba('provas')} style={{ marginRight: '5px', fontWeight: aba === 'provas' ? 'bold' : 'normal' }}>Provas</button>
              <button onClick={() => setAba('adr')} style={{ marginRight: '5px', fontWeight: aba === 'adr' ? 'bold' : 'normal' }}>ADR</button>
              <button onClick={() => setAba('miniteste')} style={{ marginRight: '5px', fontWeight: aba === 'miniteste' ? 'bold' : 'normal' }}>Miniteste</button>
              <button onClick={() => setAba('participacao')} style={{ fontWeight: aba === 'participacao' ? 'bold' : 'normal' }}>Participacao</button>
            </div>

            {aba === 'provas' && <AbaProvas turmaId={turmaSelecionada} bimestre={bimestre} />}
            {aba === 'adr' && <AbaAdr turmaId={turmaSelecionada} bimestre={bimestre} />}
            {aba === 'miniteste' && <AbaPresenca turmaId={turmaSelecionada} bimestre={bimestre} tipo="miniteste" />}
            {aba === 'participacao' && <AbaPresenca turmaId={turmaSelecionada} bimestre={bimestre} tipo="participacao" />}
          </div>
        )}
      </div>
    </div>
  )
}

function AbaProvas({ turmaId, bimestre }) {
  const [provas, setProvas] = useState([])
  const [alunos, setAlunos] = useState([])
  const [nomeProva, setNomeProva] = useState('')
  const [provaSelecionada, setProvaSelecionada] = useState('')
  const [notas, setNotas] = useState({})

  useEffect(() => {
    buscarProvas()
    buscarAlunos()
  }, [turmaId, bimestre])

  async function buscarProvas() {
    const { data } = await supabase
      .from('provas')
      .select('*')
      .eq('turma_id', turmaId)
      .eq('bimestre', bimestre)
    setProvas(data || [])
  }

  async function buscarAlunos() {
    const { data } = await supabase
      .from('turma_aluno')
      .select('usuarios(id, nome)')
      .eq('turma_id', turmaId)
    setAlunos(data?.map(a => a.usuarios) || [])
  }

  async function criarProva() {
    if (!nomeProva) return
    await supabase.from('provas').insert({
      turma_id: turmaId,
      nome: nomeProva,
      bimestre: parseInt(bimestre)
    })
    setNomeProva('')
    buscarProvas()
  }

  async function buscarNotas(provaId) {
    setProvaSelecionada(provaId)
    const { data } = await supabase
      .from('notas_prova')
      .select('*')
      .eq('prova_id', provaId)
    const notasMap = {}
    data?.forEach(n => { notasMap[n.aluno_id] = n.nota })
    setNotas(notasMap)
  }

  async function salvarNotas() {
    for (const aluno of alunos) {
      const nota = parseFloat(notas[aluno.id])
      if (isNaN(nota)) continue

      const { data: existing } = await supabase
        .from('notas_prova')
        .select('id')
        .eq('prova_id', provaSelecionada)
        .eq('aluno_id', aluno.id)
        .single()

      if (existing) {
        await supabase.from('notas_prova').update({ nota }).eq('id', existing.id)
      } else {
        await supabase.from('notas_prova').insert({ prova_id: provaSelecionada, aluno_id: aluno.id, nota })
      }
    }
    alert('Notas salvas!')
  }

  return (
    <div>
      <h2>Provas</h2>
      <input placeholder="Nome da prova" value={nomeProva} onChange={(e) => setNomeProva(e.target.value)} />
      <button onClick={criarProva}>Criar prova</button>

      {provas.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <select value={provaSelecionada} onChange={(e) => buscarNotas(e.target.value)}>
            <option value="">Selecione a prova</option>
            {provas.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
      )}

      {provaSelecionada && (
        <div style={{ marginTop: '10px' }}>
          <table border="1" cellPadding="8">
            <thead>
              <tr><th>Aluno</th><th>Nota (0-10)</th></tr>
            </thead>
            <tbody>
              {alunos.map(aluno => (
                <tr key={aluno.id}>
                  <td>{aluno.nome}</td>
                  <td>
                    <input
                      type="number" min="0" max="10" step="0.1"
                      value={notas[aluno.id] || ''}
                      onChange={(e) => setNotas({ ...notas, [aluno.id]: e.target.value })}
                      style={{ width: '60px' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={salvarNotas} style={{ marginTop: '10px' }}>Salvar notas</button>
        </div>
      )}
    </div>
  )
}

function AbaAdr({ turmaId, bimestre }) {
  const [alunos, setAlunos] = useState([])
  const [notas, setNotas] = useState({})

  useEffect(() => {
    buscarAlunos()
  }, [turmaId, bimestre])

  async function buscarAlunos() {
    const { data } = await supabase
      .from('turma_aluno')
      .select('usuarios(id, nome)')
      .eq('turma_id', turmaId)
    const lista = data?.map(a => a.usuarios) || []
    setAlunos(lista)

    const { data: notasData } = await supabase
      .from('notas_adr')
      .select('*')
      .eq('turma_id', turmaId)
      .eq('bimestre', bimestre)
    const notasMap = {}
    notasData?.forEach(n => { notasMap[n.aluno_id] = n.nota })
    setNotas(notasMap)
  }

  async function salvarNotas() {
    for (const aluno of alunos) {
      const nota = parseFloat(notas[aluno.id])
      if (isNaN(nota)) continue

      const { data: existing } = await supabase
        .from('notas_adr')
        .select('id')
        .eq('aluno_id', aluno.id)
        .eq('turma_id', turmaId)
        .eq('bimestre', bimestre)
        .single()

      if (existing) {
        await supabase.from('notas_adr').update({ nota }).eq('id', existing.id)
      } else {
        await supabase.from('notas_adr').insert({ aluno_id: aluno.id, turma_id: turmaId, bimestre: parseInt(bimestre), nota })
      }
    }
    alert('Notas ADR salvas!')
  }

  return (
    <div>
      <h2>ADR</h2>
      <table border="1" cellPadding="8">
        <thead>
          <tr><th>Aluno</th><th>Nota ADR (0-10)</th></tr>
        </thead>
        <tbody>
          {alunos.map(aluno => (
            <tr key={aluno.id}>
              <td>{aluno.nome}</td>
              <td>
                <input
                  type="number" min="0" max="10" step="0.1"
                  value={notas[aluno.id] || ''}
                  onChange={(e) => setNotas({ ...notas, [aluno.id]: e.target.value })}
                  style={{ width: '60px' }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={salvarNotas} style={{ marginTop: '10px' }}>Salvar notas ADR</button>
    </div>
  )
}

function AbaPresenca({ turmaId, bimestre, tipo }) {
  const [alunos, setAlunos] = useState([])
  const [descricao, setDescricao] = useState('')
  const [presencas, setPresencas] = useState({})
  const [registros, setRegistros] = useState([])

  useEffect(() => {
    buscarAlunos()
    buscarRegistros()
  }, [turmaId, bimestre, tipo])

  async function buscarAlunos() {
    const { data } = await supabase
      .from('turma_aluno')
      .select('usuarios(id, nome)')
      .eq('turma_id', turmaId)
    setAlunos(data?.map(a => a.usuarios) || [])
  }

  async function buscarRegistros() {
    const tabela = tipo === 'miniteste' ? 'registros_miniteste' : 'registros_participacao'
    const { data } = await supabase
      .from(tabela)
      .select('*, usuarios(nome)')
      .eq('turma_id', turmaId)
      .eq('bimestre', bimestre)
      .order('data', { ascending: false })
    setRegistros(data || [])
  }

  async function salvarPresenca() {
    if (!descricao) return
    const tabela = tipo === 'miniteste' ? 'registros_miniteste' : 'registros_participacao'
    const campo = tipo === 'miniteste' ? 'presente' : 'participou'

    for (const aluno of alunos) {
      await supabase.from(tabela).insert({
        aluno_id: aluno.id,
        turma_id: turmaId,
        bimestre: parseInt(bimestre),
        descricao,
        [campo]: presencas[aluno.id] || false
      })
    }

    setDescricao('')
    setPresencas({})
    buscarRegistros()
    alert('Presenca registrada!')
  }

  const titulo = tipo === 'miniteste' ? 'Miniteste' : 'Participacao'
  const campo = tipo === 'miniteste' ? 'presente' : 'participou'

  return (
    <div>
      <h2>{titulo}</h2>
      <input
        placeholder={`Descricao (ex: Miniteste 1 - Equacoes)`}
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        style={{ width: '400px' }}
      />

      <table border="1" cellPadding="8" style={{ marginTop: '10px' }}>
        <thead>
          <tr><th>Aluno</th><th>Presente</th></tr>
        </thead>
        <tbody>
          {alunos.map(aluno => (
            <tr key={aluno.id}>
              <td>{aluno.nome}</td>
              <td>
                <input
                  type="checkbox"
                  checked={presencas[aluno.id] || false}
                  onChange={(e) => setPresencas({ ...presencas, [aluno.id]: e.target.checked })}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={salvarPresenca} style={{ marginTop: '10px' }}>Registrar</button>

      {registros.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Registros anteriores</h3>
          <table border="1" cellPadding="8">
            <thead>
              <tr><th>Data</th><th>Descricao</th><th>Aluno</th><th>Presente</th></tr>
            </thead>
            <tbody>
              {registros.map(r => (
                <tr key={r.id}>
                  <td>{new Date(r.data).toLocaleDateString('pt-BR')}</td>
                  <td>{r.descricao}</td>
                  <td>{r.usuarios?.nome}</td>
                  <td>{r[campo] ? 'Sim' : 'Nao'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}