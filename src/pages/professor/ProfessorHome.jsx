import MenuProfessor from '../../components/MenuProfessor'
import Layout from '../../components/Layout'
import { Titulo } from '../../components/UI'

export default function ProfessorHome() {
  return (
    <Layout menu={<MenuProfessor />}>
      <Titulo>Painel do Professor</Titulo>
      <p className="text-gray-500">Use o menu ao lado para navegar.</p>

      <div className="grid grid-cols-3 gap-6 mt-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-700">Minhas Turmas</h2>
          <p className="text-gray-400 text-sm mt-1">Veja suas turmas e alunos</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-700">Lançamento de Notas</h2>
          <p className="text-gray-400 text-sm mt-1">Provas, ADR, miniteste e participação</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-700">Relatorios</h2>
          <p className="text-gray-400 text-sm mt-1">Acompanhe o desempenho da turma</p>
        </div>
      </div>
    </Layout>
  )
}