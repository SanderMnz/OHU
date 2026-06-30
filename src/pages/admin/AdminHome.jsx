import MenuAdmin from '../../components/MenuAdmin'

export default function AdminHome() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <MenuAdmin />
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Painel do Admin</h1>
        <p className="text-gray-500">Use o menu ao lado para navegar.</p>

        <div className="grid grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-700">Turmas</h2>
            <p className="text-gray-400 text-sm mt-1">Gerencie as turmas e períodos</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-700">Alunos</h2>
            <p className="text-gray-400 text-sm mt-1">Cadastre e gerencie alunos</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-700">Conteúdos</h2>
            <p className="text-gray-400 text-sm mt-1">Crie e organize os conteúdos</p>
          </div>
        </div>
      </div>
    </div>
  )
}