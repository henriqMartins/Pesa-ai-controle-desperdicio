import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Registro from './pages/Registro'
import Painel from './pages/Painel'
import Configuracao from './pages/Configuracao'

const linkBase = 'px-3 py-2 rounded text-sm font-medium'
const linkClass = ({ isActive }: { isActive: boolean }) =>
  `${linkBase} ${isActive ? 'bg-teal-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`

function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-gray-50">
      <header className="border-b bg-white">
        <nav className="mx-auto flex max-w-3xl items-center gap-1 p-3">
          <span className="mr-2 font-semibold text-teal-700">Pesa Aí</span>
          <NavLink to="/registro" className={linkClass}>
            Registro
          </NavLink>
          <NavLink to="/painel" className={linkClass}>
            Painel
          </NavLink>
          <NavLink to="/configuracao" className={linkClass}>
            Configuração
          </NavLink>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/registro" replace />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/painel" element={<Painel />} />
          <Route path="/configuracao" element={<Configuracao />} />
          <Route path="*" element={<Navigate to="/registro" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
