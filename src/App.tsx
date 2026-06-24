import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Registro from './pages/Registro'
import Painel from './pages/Painel'
import Configuracao from './pages/Configuracao'

const GRAD = 'linear-gradient(135deg, #ff8a4c, #f0464e)'

function linkClass({ isActive }: { isActive: boolean }) {
  return [
    'px-3 py-2 rounded-xl text-sm font-bold transition-colors',
    isActive
      ? 'bg-white/[.12] text-white'
      : 'text-white/60 hover:text-white hover:bg-white/[.07]',
  ].join(' ')
}

function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-app">
      <header
        className="sticky top-0 z-30 border-b"
        style={{
          background: 'rgba(10,8,6,.90)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderColor: 'rgba(255,220,180,.07)',
        }}
      >
        <nav className="mx-auto flex max-w-5xl items-center gap-1 px-5 py-2.5">
          {/* Logo mark */}
          <div className="flex items-center gap-3 mr-5 flex-none">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-none"
              style={{ background: GRAD, boxShadow: '0 6px 18px rgba(240,70,78,.38)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <div className="text-[13px] font-extrabold leading-none" style={{ color: '#ff8a4c' }}>
                Petiscaria Aquino
              </div>
              <div className="text-[10px] font-semibold leading-none mt-0.5 text-white/40">
                Monitor de Desperdício
              </div>
            </div>
          </div>

          {/* Nav links */}
          <NavLink to="/registro" className={linkClass}>Registro</NavLink>
          <NavLink to="/painel"   className={linkClass}>Painel</NavLink>
          <NavLink to="/configuracao" className={linkClass}>Configuração</NavLink>

          {/* AO VIVO */}
          <div
            className="ml-auto flex items-center gap-2 rounded-xl px-3 py-1.5"
            style={{
              background: 'rgba(255,255,255,.05)',
              border: '1px solid rgba(255,220,180,.07)',
            }}
          >
            <span
              className="w-2 h-2 rounded-full flex-none"
              style={{
                background: '#f0464e',
                boxShadow: '0 0 8px #f0464e',
                animation: 'livedot 1.4s ease-in-out infinite',
              }}
            />
            <span className="text-[11px] font-bold tracking-wider" style={{ color: '#f0464e' }}>
              AO VIVO
            </span>
          </div>
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
          <Route path="/"            element={<Navigate to="/registro" replace />} />
          <Route path="/registro"    element={<Registro />} />
          <Route path="/painel"      element={<Painel />} />
          <Route path="/configuracao" element={<Configuracao />} />
          <Route path="*"            element={<Navigate to="/registro" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
