import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function MenuAdmin() {
  return (
    <div style={{ width: '200px', borderRight: '1px solid #ccc', padding: '20px', minHeight: '100vh' }}>
      <h2>OHU Admin</h2>
      <nav>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li><Link to="/admin">Painel</Link></li>
          <li><Link to="/admin/turmas">Turmas</Link></li>
          <li><Link to="/admin/professores">Professores</Link></li>
          <li><Link to="/admin/alunos">Alunos</Link></li>
          <li><Link to="/admin/conteudos">Conteúdos</Link></li>
        </ul>
      </nav>
      <button onClick={() => supabase.auth.signOut()}>Sair</button>
    </div>
  )
}