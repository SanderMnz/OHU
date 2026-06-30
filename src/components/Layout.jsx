import { useState } from 'react'

export default function Layout({ children, menu }) {
  const [menuAberto, setMenuAberto] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="md:hidden flex items-center justify-between bg-blue-600 text-white px-4 py-3 fixed top-0 left-0 right-0 z-30">
        <span className="font-bold tracking-widest">OHU</span>
        <button onClick={() => setMenuAberto(!menuAberto)} className="text-2xl leading-none">
          {menuAberto ? '✕' : '☰'}
        </button>
      </div>

      {menuAberto && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-20" onClick={() => setMenuAberto(false)} />
      )}

      <div className={`fixed md:static top-0 left-0 h-full z-20 transition-transform duration-200 ${menuAberto ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        {menu}
      </div>

      <div className="flex-1 p-2 md:p-8 max-w-6xl pt-16 md:pt-8 w-full overflow-x-hidden">
        {children}
      </div>
    </div>
  )
}