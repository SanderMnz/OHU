import { supabase } from '../../lib/supabase'

export default function AlunoHome() {
  return (
    <div>
      <h1>Área do Aluno</h1>
      <button onClick={() => supabase.auth.signOut()}>Sair</button>
    </div>
  )
}