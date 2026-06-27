import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function MenuProfessor() {
  return (
    <div style={{ width: '200px', borderRight: '1px solid #ccc', padding: '20px', minHeight: '100vh' }}>
      <h2>OHU Professor</h2>
      <nav>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li><Link to="/professor">Painel</Link></li>
          <li><Link to="/professor/turmas">Minhas Turmas</Link></li>
          <li><Link to="/professor/notas">Lancamento de Notas</Link></li>
          <li><Link to="/professor/relatorios">Relatorios</Link></li>
          <li><Link to="/professor/exercicios">Exercicios Alunos</Link></li>
        </ul>
      </nav>
      <button onClick={() => supabase.auth.signOut()}>Sair</button>
    </div>
  )
}