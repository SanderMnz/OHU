import MenuAluno from '../../components/MenuAluno'
import Layout from '../../components/Layout'
import { Titulo } from '../../components/UI'

export default function AlunoHome() {
  return (
    <Layout menu={<MenuAluno />}>
      <Titulo>Bem vindo!</Titulo>
      <p className="text-gray-500">Use o menu ao lado para navegar.</p>

      <div className="grid grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-700">Conteúdos</h2>
          <p className="text-gray-400 text-sm mt-1">Explore as aulas e exercícios da sua turma</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-700">Minhas Notas</h2>
          <p className="text-gray-400 text-sm mt-1">Acompanhe seu desempenho e boletim</p>
        </div>
      </div>
    </Layout>
  )
}