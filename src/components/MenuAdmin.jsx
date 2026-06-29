import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function MenuAdmin() {
  const location = useLocation()

  const links = [
    { to: '/admin', label: 'Painel' },
    { to: '/admin/turmas', label: 'Turmas' },
    { to: '/admin/professores', label: 'Professores' },
    { to: '/admin/alunos', label: 'Alunos' },
    { to: '/admin/conteudos', label: 'Conteudos' },
  ]

  return (
    <div className="w-56 min-h-screen bg-blue-600 text-white flex flex-col">
      <div className="p-6 border-b border-blue-500">
        <h1 className="text-2xl font-bold">OHU</h1>
        <p className="text-blue-200 text-sm">Admin</p>
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