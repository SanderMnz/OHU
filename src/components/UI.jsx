export function Titulo({ children }) {
  return <h1 className="text-3xl font-bold text-gray-800 mb-6">{children}</h1>
}

export function Subtitulo({ children }) {
  return <h2 className="text-xl font-semibold text-gray-700 mb-4 mt-6">{children}</h2>
}

export function Botao({ children, onClick, disabled, variante = 'primary', type = 'button' }) {
  const estilos = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    success: 'bg-green-500 hover:bg-green-600 text-white',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 ${estilos[variante]}`}
    >
      {children}
    </button>
  )
}

export function Input({ placeholder, value, onChange, type = 'text', className = '' }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    />
  )
}

export function Select({ value, onChange, children, className = '' }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${className}`}
    >
      {children}
    </select>
  )
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
      {children}
    </div>
  )
}

export function Tabela({ cabecalho, children }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
          <tr>
            {cabecalho.map((col, i) => (
              <th key={i} className="px-4 py-3 text-left font-semibold">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {children}
        </tbody>
      </table>
    </div>
  )
}

export function Erro({ children }) {
  if (!children) return null
  return <p className="text-red-500 text-sm mt-2">{children}</p>
}

export function Sucesso({ children }) {
  if (!children) return null
  return <p className="text-green-500 text-sm mt-2">{children}</p>
}