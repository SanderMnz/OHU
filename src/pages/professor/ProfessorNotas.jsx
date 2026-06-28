import { useEffect, useState } from 'react'
import MenuProfessor from '../../components/MenuProfessor'
import { supabase } from '../../lib/supabase'

export default function ProfessorNotas() {
  const [turmas, setTurmas] = useState([])
  const [turmaSelecionada, setTurmaSelecionada] = useState(null)
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

  function labelPeriodo(turma) {
    if (!turma) return ''
    const tipo = turma.tipo === 'eja' ? 'Trimestre' : 'Bimestre'
    return `${turma.periodo_ativo}º ${tipo}`
  }

  return (
    <div style={{ display: 'flex' }}>
      <MenuProfessor />
      <div style={{ padding: '20px', minWidth: '700px' }}>
        <h1>Lancamento de Notas</h1>

        <div style={{ marginBottom: '20px' }}>
          <select
            value={turmaSelecionada?.id || ''}
            onChange={(e) => {
              const turma = turmas.find(t => t.id === e.target.value)
              setTurmaSelecionada(turma || null)
            }}
          >
            <option value="">Selecione a turma</option>
            {turmas.map(t => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>

          {turmaSelecionada && (
            <strong style={{ marginLeft: '15px' }}>
              Periodo ativo: {labelPeriodo(turmaSelecionada)}
            </strong>
          )}
        </div>

        {turmaSelecionada && (
          <div>
            <div style={{ marginBottom: '10px' }}>
              <button onClick={() => setAba('provas')} style={{ marginRight: '5px', fontWeight: aba === 'provas' ? 'bold' : 'normal' }}>Provas</button>
              <button onClick={() => setAba('adr')} style={{ marginRight: '5px', fontWeight: aba === 'adr' ? 'bold' : 'normal' }}>ADR</button>
              <button onClick={() => setAba('miniteste')} style={{ marginRight: '5px', fontWeight: aba === 'miniteste' ? 'bold' : 'normal' }}>Miniteste</button>
              <button onClick={() => setAba('participacao')} style={{ fontWeight: aba === 'participacao' ? 'bold' : 'normal' }}>Participacao</button>
            </div>

            {aba === 'provas' && <AbaProvas turma={turmaSelecionada} />}
            {aba === 'adr' && <AbaAdr turma={turmaSelecionada} />}
            {aba === 'miniteste' && <AbaPresenca turma={turmaSelecionada} tipo="miniteste" />}
            {aba === 'participacao' && <AbaPresenca turma={turmaSelecionada} tipo="participacao" />}
          </div>
        )}
      </div>
    </div>
  )
}

function AbaProvas({ turma }) {
  const [provas, setProvas] = useState([])
  const [alunos, setAlunos] = useState([])
  const [nomeProva, setNomeProva] = useState('')
  const [dataProva, setDataProva] = useState('')
  const [provaSelecionada, setProvaSelecionada] = useState('')
  const [notas, setNotas] = useState({})
  const [editandoProva, setEditandoProva] = useState(null)
  const [nomeEditado, setNomeEditado] = useState('')

  useEffect(() => {
    buscarProvas()
    buscarAlunos()
  }, [turma])

  async function buscarProvas() {
    const { data } = await supabase
      .from('provas')
      .select('*')
      .eq('turma_id', turma.id)
      .eq('bimestre', turma.periodo_ativo)
      .order('criado_em')
    setProvas(data || [])
  }

  async function buscarAlunos() {
    const { data } = await supabase
      .from('turma_aluno')
      .select('usuarios(id, nome)')
      .eq('turma_id', turma.id)
    setAlunos(data?.map(a => a.usuarios) || [])
  }

  async function criarProva() {
    if (!nomeProva) return
    await supabase.from('provas').insert({
      turma_id: turma.id,
      nome: nomeProva,
      bimestre: turma.periodo_ativo,
      data: dataProva || null
    })
    setNomeProva('')
    setDataProva('')
    buscarProvas()
  }

  async function editarProva(prova) {
    setEditandoProva(prova.id)
    setNomeEditado(prova.nome)
  }

  async function salvarEdicaoProva(provaId) {
    if (!nomeEditado) return
    await supabase.from('provas').update({ nome: nomeEditado }).eq('id', provaId)
    setEditandoProva(null)
    setNomeEditado('')
    buscarProvas()
  }

  async function excluirProva(provaId) {
    if (!confirm('Excluir esta prova e todas as notas? Esta acao nao pode ser desfeita.')) return
    await supabase.from('notas_prova').delete().eq('prova_id', provaId)
    await supabase.from('provas').delete().eq('id', provaId)
    setProvaSelecionada('')
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
        .maybeSingle()
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
      <div style={{ marginBottom: '10px' }}>
        <input
          placeholder="Nome da prova"
          value={nomeProva}
          onChange={(e) => setNomeProva(e.target.value)}
        />
        <input
          type="date"
          value={dataProva}
          onChange={(e) => setDataProva(e.target.value)}
          style={{ marginLeft: '10px' }}
        />
        <button onClick={criarProva} style={{ marginLeft: '10px' }}>Criar prova</button>
      </div>

      {provas.length > 0 && (
        <table border="1" cellPadding="8" style={{ marginBottom: '15px' }}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Data</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {provas.map(p => (
              <tr key={p.id} style={{ background: provaSelecionada === p.id ? '#f0f0f0' : 'white' }}>
                <td>
                  {editandoProva === p.id ? (
                    <input
                      value={nomeEditado}
                      onChange={(e) => setNomeEditado(e.target.value)}
                      style={{ width: '200px' }}
                    />
                  ) : p.nome}
                </td>
                <td>{p.data ? new Date(p.data).toLocaleDateString('pt-BR') : '-'}</td>
                <td>
                  {editandoProva === p.id ? (
                    <>
                      <button onClick={() => salvarEdicaoProva(p.id)}>Salvar</button>
                      <button onClick={() => setEditandoProva(null)} style={{ marginLeft: '5px' }}>Cancelar</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => buscarNotas(p.id)}>Lancar notas</button>
                      <button onClick={() => editarProva(p)} style={{ marginLeft: '5px' }}>Editar</button>
                      <button onClick={() => excluirProva(p.id)} style={{ marginLeft: '5px' }}>Excluir</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {provaSelecionada && (
        <div style={{ marginTop: '10px' }}>
          <h3>Lancamento de notas: {provas.find(p => p.id === provaSelecionada)?.nome}</h3>
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

function AbaAdr({ turma }) {
  const [alunos, setAlunos] = useState([])
  const [notas, setNotas] = useState({})

  useEffect(() => {
    buscarAlunos()
  }, [turma])

  async function buscarAlunos() {
    const { data } = await supabase
      .from('turma_aluno')
      .select('usuarios(id, nome)')
      .eq('turma_id', turma.id)
    const lista = data?.map(a => a.usuarios) || []
    setAlunos(lista)
    const { data: notasData } = await supabase
      .from('notas_adr')
      .select('*')
      .eq('turma_id', turma.id)
      .eq('bimestre', turma.periodo_ativo)
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
        .eq('turma_id', turma.id)
        .eq('bimestre', turma.periodo_ativo)
        .maybeSingle()
      if (existing) {
        await supabase.from('notas_adr').update({ nota }).eq('id', existing.id)
      } else {
        await supabase.from('notas_adr').insert({ aluno_id: aluno.id, turma_id: turma.id, bimestre: turma.periodo_ativo, nota })
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

function AbaPresenca({ turma, tipo }) {
  const [alunos, setAlunos] = useState([])
  const [descricao, setDescricao] = useState('')
  const [presencas, setPresencas] = useState({})
  const [registros, setRegistros] = useState([])

  useEffect(() => {
    buscarAlunos()
    buscarRegistros()
  }, [turma, tipo])

  async function buscarAlunos() {
    const { data } = await supabase
      .from('turma_aluno')
      .select('usuarios(id, nome)')
      .eq('turma_id', turma.id)
    setAlunos(data?.map(a => a.usuarios) || [])
  }

  async function buscarRegistros() {
    const tabela = tipo === 'miniteste' ? 'registros_miniteste' : 'registros_participacao'
    const { data } = await supabase
      .from(tabela)
      .select('*')
      .eq('turma_id', turma.id)
      .eq('bimestre', turma.periodo_ativo)
      .order('data', { ascending: true })
    setRegistros(data || [])
  }

  async function salvarPresenca() {
    if (!descricao) return
    const tabela = tipo === 'miniteste' ? 'registros_miniteste' : 'registros_participacao'
    const campo = tipo === 'miniteste' ? 'presente' : 'participou'

    for (const aluno of alunos) {
      await supabase.from(tabela).insert({
        aluno_id: aluno.id,
        turma_id: turma.id,
        bimestre: turma.periodo_ativo,
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

  const eventos = []
  const eventosVistos = new Set()
  registros.forEach(r => {
    const chave = `${r.descricao}__${new Date(r.data).toLocaleDateString('pt-BR')}`
    if (!eventosVistos.has(chave)) {
      eventosVistos.add(chave)
      eventos.push({ descricao: r.descricao, data: new Date(r.data).toLocaleDateString('pt-BR') })
    }
  })

  return (
    <div>
      <h2>{titulo}</h2>
      <div style={{ marginBottom: '10px' }}>
        <input
          placeholder="Descricao (ex: Miniteste 1 - Equacoes)"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          style={{ width: '400px' }}
        />
        <button onClick={salvarPresenca} style={{ marginLeft: '10px' }}>Registrar</button>
      </div>

      {eventos.length > 0 && (
        <table border="1" cellPadding="8" style={{ marginTop: '10px' }}>
          <thead>
            <tr>
              <th>Aluno</th>
              {eventos.map((e, i) => (
                <th key={i}>{e.descricao}<br /><small>{e.data}</small></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {alunos.map(aluno => (
              <tr key={aluno.id}>
                <td>{aluno.nome}</td>
                {eventos.map((evento, i) => {
                  const reg = registros.find(r =>
                    r.aluno_id === aluno.id &&
                    r.descricao === evento.descricao &&
                    new Date(r.data).toLocaleDateString('pt-BR') === evento.data
                  )
                  return (
                    <td key={i} style={{ textAlign: 'center' }}>
                      {reg ? (reg[campo] ? '✅' : '❌') : '-'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: '20px' }}>
        <h3>Novo registro</h3>
        <table border="1" cellPadding="8">
          <thead>
            <tr><th>Aluno</th><th>Presente</th></tr>
          </thead>
          <tbody>
            {alunos.map(aluno => (
              <tr key={aluno.id}>
                <td>{aluno.nome}</td>
                <td style={{ textAlign: 'center' }}>
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
      </div>
    </div>
  )
}