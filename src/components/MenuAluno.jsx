import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function MenuAluno() {
  return (
    <div style={{ width: '200px', borderRight: '1px solid #ccc', padding: '20px', minHeight: '100vh' }}>
      <h2>OHU</h2>
      <nav>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li><Link to="/aluno">Inicio</Link></li>
          <li><Link to="/aluno/conteudos">Conteudos</Link></li>
          <li><Link to="/aluno/notas">Minhas Notas</Link></li>
        </ul>
      </nav>
      <button onClick={() => supabase.auth.signOut()}>Sair</button>
    </div>
  )
}