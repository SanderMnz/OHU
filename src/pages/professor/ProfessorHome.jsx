import { supabase } from '../../lib/supabase'

export default function ProfessorHome() {
  return (
    <div>
      <h1>Área do Professor</h1>
      <button onClick={() => supabase.auth.signOut()}>Sair</button>
    </div>
  )
}