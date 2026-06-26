import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import AdminHome from './pages/admin/AdminHome'
import ProfessorHome from './pages/professor/ProfessorHome'
import AlunoHome from './pages/aluno/AlunoHome'

function App() {
  const [sessao, setSessao] = useState(null)
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessao(session)
      if (session) buscarUsuario(session.user.id)
      else setCarregando(false)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSessao(session)
      if (session) buscarUsuario(session.user.id)
      else {
        setUsuario(null)
        setCarregando(false)
      }
    })
  }, [])

  async function buscarUsuario(id) {
    const { data } = await supabase
      .from('usuarios')
      .select('tipo')
      .eq('id', id)
      .single()
    setUsuario(data)
    setCarregando(false)
  }

  if (carregando) return <p>Carregando...</p>

  if (!sessao) return <Login />

  return (
    <Routes>
      <Route path="/admin" element={usuario?.tipo === 'admin' ? <AdminHome /> : <Navigate to="/" />} />
      <Route path="/professor" element={usuario?.tipo === 'professor' ? <ProfessorHome /> : <Navigate to="/" />} />
      <Route path="/aluno" element={usuario?.tipo === 'aluno' ? <AlunoHome /> : <Navigate to="/" />} />
      <Route path="*" element={
        usuario?.tipo === 'admin' ? <Navigate to="/admin" /> :
        usuario?.tipo === 'professor' ? <Navigate to="/professor" /> :
        <Navigate to="/aluno" />
      } />
    </Routes>
  )
}

export default App