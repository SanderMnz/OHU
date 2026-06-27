import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'

export default function AlunoHome() {
  return (
    <div style={{ display: 'flex' }}>
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
      <div style={{ padding: '20px' }}>
        <h1>Bem vindo!</h1>
        <p>Use o menu ao lado para navegar.</p>
      </div>
    </div>
  )
}