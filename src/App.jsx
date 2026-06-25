import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'

function App() {
  const [sessao, setSessao] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessao(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSessao(session)
    })
  }, [])

  if (!sessao) {
    return <Login />
  }

  return (
    <div>
      <h1>Bem vindo! Você está logado.</h1>
      <button onClick={() => supabase.auth.signOut()}>Sair</button>
    </div>
  )
}

export default App