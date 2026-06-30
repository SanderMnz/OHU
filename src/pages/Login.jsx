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

    const { error } = await supabase.auth.signInWithPassword({
      email: emailFinal,
      password: senha,
    })

    if (error) {
      setErro('Usuário ou senha incorretos')
    }

    setCarregando(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-10 rounded-2xl shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="OHU Logo" className="w-32 mx-auto mb-2" />
          <h1 className="text-4xl font-bold text-blue-600 tracking-widest">OHU</h1>
          <p className="text-gray-500 mt-1 text-sm italic">Matemática para quem quer Saber!</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuário ou email
            </label>
            <input
              type="text"
              placeholder="Digite seu usuário ou email"
              value={identificacao}
              onChange={(e) => setIdentificacao(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              type="password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {erro && (
            <p className="text-red-500 text-sm text-center">{erro}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={carregando}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </div>
    </div>
  )
}