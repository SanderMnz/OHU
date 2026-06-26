import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [identificacao, setIdentificacao] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleLogin() {
    setCarregando(true)
    setErro('')

    const isEmail = identificacao.includes('@')
    const emailFinal = isEmail ? identificacao : `${identificacao}@ohu.app`

    console.log('email tentando:', emailFinal)

    const { error } = await supabase.auth.signInWithPassword({
      email: emailFinal,
      password: senha,
    })

    console.log('erro:', error)

    if (error) {
      setErro('Usuário ou senha incorretos')
    }

    setCarregando(false)
  }

  return (
    <div>
      <h1>OHU — Login</h1>

      <input
        type="text"
        placeholder="Email ou nome de usuário"
        value={identificacao}
        onChange={(e) => setIdentificacao(e.target.value)}
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

      {erro && <p style={{ color: 'red' }}>{erro}</p>}
    </div>
  )
}