import { useState } from 'react'
import TecladoPin from './TecladoPin'
import { useLockout } from '../hooks/useLockout'
import { entrarComPin, type Papel } from '../lib/auth'

// Tela de login: escolha de perfil + teclado de PIN. Ao completar 6 dígitos,
// loga automaticamente. Lockout (useLockout) protege contra tentativa e erro.

const GRAD = 'var(--accent-grad)'

const PERFIS: { papel: Papel; label: string }[] = [
  { papel: 'funcionario', label: 'Funcionário' },
  { papel: 'gestor', label: 'Gestor' },
]

export default function TelaPin() {
  const [papel, setPapel] = useState<Papel>('funcionario')
  const [pin, setPin] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const { bloqueado, segundosRestantes, registrarErro, resetar } = useLockout()

  async function enviar(pinCompleto: string) {
    setEnviando(true)
    try {
      await entrarComPin(papel, pinCompleto)
      resetar()
      // onAuthStateChange (useSessao → ProtectedRoute) troca de tela sozinho.
    } catch {
      registrarErro()
      setErro('PIN incorreto')
      setPin('')
    } finally {
      setEnviando(false)
    }
  }

  function aoMudar(next: string) {
    setErro(null)
    setPin(next)
    if (next.length === 6) enviar(next)
  }

  function trocarPerfil(p: Papel) {
    setPapel(p)
    setPin('')
    setErro(null)
  }

  const mensagem = bloqueado ? `Muitas tentativas. Aguarde ${segundosRestantes}s` : erro

  return (
    <div className="flex min-h-full items-center justify-center bg-app px-6">
      <div className="anim-pop w-full max-w-xs">
        {/* Marca */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: GRAD, boxShadow: '0 8px 24px rgba(240,70,78,.4)' }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </div>
          <div className="text-center">
            <div className="text-base font-extrabold" style={{ color: 'var(--orange)' }}>
              Petiscaria Aquino
            </div>
            <div className="mt-0.5 text-xs font-semibold text-white/40">Digite seu PIN para entrar</div>
          </div>
        </div>

        {/* Perfil */}
        <div
          className="mb-6 flex gap-1 rounded-xl p-1"
          style={{ background: 'var(--w-05)', border: '1px solid var(--bd-07)' }}
        >
          {PERFIS.map(({ papel: p, label }) => (
            <button
              key={p}
              type="button"
              onClick={() => trocarPerfil(p)}
              className="flex-1 rounded-lg py-2 text-sm font-bold transition-colors"
              style={papel === p ? { background: GRAD, color: '#fff' } : { color: 'var(--tx-55)' }}
            >
              {label}
            </button>
          ))}
        </div>

        <TecladoPin pin={pin} onChange={aoMudar} desabilitado={enviando || bloqueado} />

        {/* Mensagem (altura fixa evita "pulo" do layout) */}
        <div className="mt-3 h-5 text-center text-sm font-bold" style={{ color: 'var(--red)' }}>
          {mensagem ?? ''}
        </div>
      </div>
    </div>
  )
}
