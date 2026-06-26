import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import AdminHome from './pages/admin/AdminHome'
import Turmas from './pages/admin/Turmas'
import Professores from './pages/admin/Professores'
import Alunos from './pages/admin/Alunos'
import Conteudos from './pages/admin/Conteudos'
import ProfessorHome from './pages/professor/ProfessorHome'
import AlunoHome from './pages/aluno/AlunoHome'
import EditarConteudo from './pages/admin/EditarConteudo'

function App() {
  const [sessao, setSessao] = useState(undefined)
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessao(session)
      if (session) {
        buscarUsuario(session.user.id)
      } else {
        setUsuario(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function buscarUsuario(id) {
    const { data } = await supabase
      .from('usuarios')
      .select('tipo')
      .eq('id', id)
      .single()
    setUsuario(data)
  }

  if (sessao === undefined) return <p>Carregando...</p>
  if (!sessao) return <Login />

  if (!usuario) return <p>Carregando...</p>

  return (
    <Routes>
      <Route path="/admin" element={usuario.tipo === 'admin' ? <AdminHome /> : <Navigate to="/" />} />
      <Route path="/admin/turmas" element={usuario.tipo === 'admin' ? <Turmas /> : <Navigate to="/" />} />
      <Route path="/admin/professores" element={usuario.tipo === 'admin' ? <Professores /> : <Navigate to="/" />} />
      <Route path="/admin/alunos" element={usuario.tipo === 'admin' ? <Alunos /> : <Navigate to="/" />} />
      <Route path="/admin/conteudos" element={usuario.tipo === 'admin' ? <Conteudos /> : <Navigate to="/" />} />
      <Route path="/admin/conteudos/:id" element={usuario.tipo === 'admin' ? <EditarConteudo /> : <Navigate to="/" />} />
      <Route path="/professor" element={usuario.tipo === 'professor' ? <ProfessorHome /> : <Navigate to="/" />} />
      <Route path="/aluno" element={usuario.tipo === 'aluno' ? <AlunoHome /> : <Navigate to="/" />} />
      <Route path="*" element={
        usuario.tipo === 'admin' ? <Navigate to="/admin" /> :
        usuario.tipo === 'professor' ? <Navigate to="/professor" /> :
        <Navigate to="/aluno" />
      } />
    </Routes>
  )
}

export default App