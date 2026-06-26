import { supabase } from '../../lib/supabase'

export default function AdminHome() {
  return (
    <div>
      <h1>Área do Admin</h1>
      <button onClick={() => supabase.auth.signOut()}>Sair</button>
    </div>
  )
}