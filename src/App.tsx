                                                                                                                                                                                                                                                          import { useEffect, useState, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Monitor from './pages/Monitor'
import Produtos from './pages/Produtos'
import Equipe from './pages/Equipe'
import Motivos from './pages/Motivos'
import Pratos from './pages/Pratos'
import RegistrarModal from './components/RegistrarModal'
import ModoExibicao from './components/ModoExibicao'
import FiltrosModal from './components/FiltrosModal'
import { useTheme } from './hooks/useTheme'
import { useEhGestor } from './hooks/useEhGestor'
import { FUSO } from './lib/fuso'

const GRAD = 'var(--accent-grad)'

// ─── Ícones (inline, sem dependência) ──────────────────────────────────────────

type IconProps = { className?: string }
const ic = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

const IconMonitor = (p: IconProps) => (
  <svg {...ic} {...p}><path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" /></svg>
)
const IconProdutos = (p: IconProps) => (
  <svg {...ic} {...p}><path d="M3 9l1-5h16l1 5" /><path d="M4 9v11h16V9" /><path d="M9 13h6" /></svg>
)
const IconEquipe = (p: IconProps) => (
  <svg {...ic} {...p}><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M17 7a3 3 0 0 1 0 6M21 20a6 6 0 0 0-4-5.6" /></svg>
)
const IconMotivos = (p: IconProps) => (
  <svg {...ic} {...p}><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 3 12V4a1 1 0 0 1 1-1h8a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 0 2.6z" /><circle cx="7.5" cy="7.5" r="1.2" /></svg>
)
const IconPratos = (p: IconProps) => (
  <svg {...ic} {...p}><path d="M4 3v7a3 3 0 0 0 6 0V3" /><path d="M7 10v11" /><path d="M17 3c-1.7 0-3 2-3 5s1 4 3 4 3-1 3-4-1.3-5-3-5z" /><path d="M17 12v9" /></svg>
)

// `gestor: true` = só aparece/roteia para o perfil gestor (gating de UX — §2.2).
const NAV = [
  { to: '/monitor', label: 'Monitor', Icon: IconMonitor },
  { to: '/produtos', label: 'Produtos', Icon: IconProdutos },
  { to: '/equipe', label: 'Equipe', Icon: IconEquipe },
  { to: '/motivos', label: 'Motivos', Icon: IconMotivos },
  { to: '/pratos', label: 'Pratos', Icon: IconPratos, gestor: true },
]

// ─── Relógio AO VIVO ────────────────────────────────────────────────────────────

function RelogioAoVivo() {
  const [agora, setAgora] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const hora = agora.toLocaleTimeString('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit' })
  return (
    <div                                            
      className="flex items-center gap-2 rounded-xl px-3 py-1.5"
      style={{ background: 'var(--w-05)', border: '1px solid var(--bd-07)' }}
    >
      <span
        className="h-2 w-2 flex-none rounded-full"
        style={{ background: 'var(--red)', boxShadow: '0 0 8px var(--red)', animation: 'livedot 1.4s ease-in-out infinite' }}
      />
      <span className="whitespace-nowrap text-[11px] font-bold tracking-wider" style={{ color: 'var(--red)' }}>
        AO VIVO {hora}
      </span>
    </div>
  )
}

// ─── Botão de tema (claro / escuro) ──────────────────────────────────────────────

function BotaoTema() {
  const { tema, alternar } = useTheme()
  const ehDark = tema === 'dark'
  return (
    <button
      onClick={alternar}
      className="flex h-9 w-9 flex-none items-center justify-center rounded-xl transition-colors"
      style={{ background: 'var(--w-05)', border: '1px solid var(--bd-07)', color: 'var(--orange)' }}
      aria-label={ehDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={ehDark ? 'Tema claro' : 'Tema escuro'}
    >
      {ehDark ? (
        // sol → trocar para claro
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        // lua → trocar para escuro
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  )
}

// ─── Botão "Modo de exibição" (tela cheia p/ TV) ─────────────────────────────────

function BotaoExibicao({ onClick, compacto = false }: { onClick: () => void; compacto?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex flex-none items-center gap-2 rounded-xl transition-colors',
        compacto ? 'h-9 w-9 justify-center' : 'px-3 py-2 text-sm font-bold',
      ].join(' ')}
      style={{ background: 'var(--w-05)', border: '1px solid var(--bd-07)', color: 'var(--tx-72)' }}
      aria-label="Modo de exibição"
      title="Modo de exibição (tela cheia)"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
      </svg>
      {!compacto && 'Exibição'}
    </button>
  )
}

// ─── Botão "Filtrar" (abre o modal de filtros avançados) ─────────────────────────

function BotaoFiltrar({ onClick, compacto = false }: { onClick: () => void; compacto?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex flex-none items-center gap-2 rounded-xl transition-colors',
        compacto ? 'h-9 w-9 justify-center' : 'px-3 py-2 text-sm font-bold',
      ].join(' ')}
      style={{ background: 'var(--w-05)', border: '1px solid var(--bd-07)', color: 'var(--tx-72)' }}
      aria-label="Filtros avançados"
      title="Filtros avançados"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6h16M7 12h10M10 18h4" />
      </svg>
      {!compacto && 'Filtrar'}
    </button>
  )
}

// ─── Toast ───────────────────────────────────────────────────────────────────────

function Toast({ msg }: { msg: string }) {
  return (
    <div
      className="anim-pop fixed left-1/2 top-4 z-[60] -translate-x-1/2 rounded-xl px-4 py-2.5 text-sm font-bold"
      style={{ background: 'rgba(52,211,153,.14)', border: '1px solid rgba(52,211,153,.4)', color: 'var(--live-green)', backdropFilter: 'blur(8px)' }}
    >
      ✓ {msg}
    </div>
  )
}

// ─── Shell ────────────────────────────────────────────────────────────────────────

function Layout({ children }: { children: ReactNode }) {
  const [registrarAberto, setRegistrarAberto] = useState(false)
  const [exibicaoAberta, setExibicaoAberta] = useState(false)
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const ehGestor = useEhGestor()
  const navItens = NAV.filter((n) => !n.gestor || ehGestor)

  function aoRegistrar() {
    setToast('Registro salvo!')
    setTimeout(() => setToast(null), 2600)
  }

  return (
    <div className="min-h-full bg-app">
      {/* ── Top bar (desktop / tablet) ── */}
      <header
        className="sticky top-0 z-30 hidden border-b sm:block"
        style={{ background: 'var(--header-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderColor: 'var(--bd-07)' }}
      >
        <nav className="mx-auto flex max-w-5xl items-center gap-1 px-5 py-2.5">
          <div className="mr-5 flex flex-none items-center gap-3">
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl" style={{ background: GRAD, boxShadow: '0 6px 18px rgba(240,70,78,.38)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </div>
            <div>
              <div className="text-[13px] font-extrabold leading-none" style={{ color: 'var(--orange)' }}>Petiscaria Aquino</div>
              <div className="mt-0.5 text-[10px] font-semibold leading-none text-white/40">Monitor de Desperdício</div>
            </div>
          </div>

          {navItens.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                ['rounded-xl px-3 py-2 text-sm font-bold transition-colors', isActive ? 'text-white' : 'text-white/55 hover:bg-white/[.06] hover:text-white'].join(' ')
              }
              style={({ isActive }) => (isActive ? { background: GRAD, boxShadow: '0 4px 14px rgba(240,70,78,.22)' } : undefined)}
            >
              {label}
            </NavLink>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <RelogioAoVivo />
            <BotaoExibicao onClick={() => setExibicaoAberta(true)} />
            <BotaoTema />
            <BotaoFiltrar onClick={() => setFiltrosAbertos(true)} />
            <button
              onClick={() => setRegistrarAberto(true)}
              className="whitespace-nowrap btn-accent rounded-xl px-4 py-2 text-sm font-bold"
            >
              Registrar +
            </button>
          </div>
        </nav>
      </header>

      {/* ── Top bar enxuta (mobile) ── */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between border-b px-4 py-3 sm:hidden"
        style={{ background: 'var(--header-bg)', backdropFilter: 'blur(12px)', borderColor: 'var(--bd-07)' }}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: GRAD }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" />
            </svg>
          </div>
          <span className="text-sm font-extrabold" style={{ color: 'var(--orange)' }}>Aquino</span>
        </div>
        <div className="flex items-center gap-2">
          <RelogioAoVivo />
          <BotaoFiltrar compacto onClick={() => setFiltrosAbertos(true)} />
          <BotaoExibicao compacto onClick={() => setExibicaoAberta(true)} />
          <BotaoTema />
        </div>
      </header>

      <main className="pb-24 sm:pb-0">{children}</main>

      {/* ── Bottom nav + FAB (mobile) ── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t sm:hidden"
        style={{ background: 'var(--header-bg)', backdropFilter: 'blur(12px)', borderColor: 'var(--bd-08)' }}
      >
        {navItens.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-bold"
            style={({ isActive }) => ({ color: isActive ? 'var(--orange)' : 'var(--tx-40)' })}
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={() => setRegistrarAberto(true)}
        className="fixed bottom-[68px] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full text-3xl font-bold text-white sm:hidden"
        style={{ background: GRAD, boxShadow: '0 8px 24px rgba(240,70,78,.5)' }}
        aria-label="Registrar desperdício"
      >
        ＋
      </button>

      {registrarAberto && (
        <RegistrarModal onClose={() => setRegistrarAberto(false)} onRegistrado={aoRegistrar} />
      )}
      {exibicaoAberta && <ModoExibicao onClose={() => setExibicaoAberta(false)} />}
      {filtrosAbertos && <FiltrosModal onClose={() => setFiltrosAbertos(false)} />}
      {toast && <Toast msg={toast} />}
    </div>
  )
}

export default function App() {
  // Gating de rota (§2.2): sem ser gestor, /pratos cai no fallback do Monitor.
  const ehGestor = useEhGestor()
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/monitor" replace />} />
          <Route path="/monitor" element={<Monitor />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/equipe" element={<Equipe />} />
          <Route path="/motivos" element={<Motivos />} />
          <Route path="/pratos" element={ehGestor ? <Pratos /> : <Navigate to="/monitor" replace />} />
          <Route path="*" element={<Navigate to="/monitor" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
