export default function Layout({ children, menu }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {menu}
      <div className="flex-1 p-8 max-w-6xl">
        {children}
      </div>
    </div>
  )
}