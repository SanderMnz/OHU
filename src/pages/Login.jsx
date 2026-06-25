import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleLogin() {
    setCarregando(true)
    setErro('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    console.log('data:', data)
    console.log('erro:', error)

    if (error) {
      setErro(error.message)
    }

    setCarregando(false)
  }

  return (
    <div>
      <h1>OHU — Login</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Senha"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
      />

      <button onClick={handleLogin} disabled={carregando}>
        {carregando ? 'Entrando...' : 'Entrar'}
      </button>

      {erro && <p>{erro}</p>}
    </div>
  )
}