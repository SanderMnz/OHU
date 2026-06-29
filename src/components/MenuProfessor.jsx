import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function MenuProfessor() {
  const location = useLocation()

  const links = [
    { to: '/professor', label: 'Painel' },
    { to: '/professor/turmas', label: 'Minhas Turmas' },
    { to: '/professor/notas', label: 'Lancamento de Notas' },
    { to: '/professor/relatorios', label: 'Relatorios' },
    { to: '/professor/exercicios', label: 'Exercicios Alunos' },
  ]

  return (
    <div className="w-56 min-h-screen bg-blue-600 text-white flex flex-col">
      <div className="p-6 border-b border-blue-500">
        <img src="/logo.png" alt="OHU" className="w-12 mb-2" />
        <h1 className="text-xl font-bold tracking-widest">OHU</h1>
        <p className="text-blue-200 text-xs">Professor</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {links.map(link => {
            const ativo = location.pathname === link.to || location.pathname.startsWith(link.to + '/')
            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`block px-4 py-2 rounded-lg transition ${
                    ativo
                      ? 'bg-white text-blue-600 font-semibold'
                      : 'text-blue-100 hover:bg-blue-500'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-blue-500">
        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg transition"
        >
          Sair
        </button>
      </div>
    </div>
  )
}