import { useState } from 'react'
import TecladoPin from './TecladoPin'
import { useSessao } from '../hooks/useSessao'
import { useLock } from '../hooks/useLock'
import { useLockout } from '../hooks/useLockout'
import { entrarComPin, papelDaSessao, sair } from '../lib/auth'

// Tela de bloqueio (Fase 3): cobre o app sem derrubar a sessão. Para desbloquear,
// revalida o PIN da MESMA conta via signInWithPassword (não compara PIN no
// cliente). "Sair" continua disponível para trocar de conta / fim de turno.

const GRAD = 'var(--accent-grad)'

export default function LockOverlay() {
  const { session } = useSessao()
  const { desbloquear } = useLock()
  const { bloqueado, segundosRestantes, registrarErro, resetar } = useLockout()
  const [pin, setPin] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const papel = papelDaSessao(session)
  const rotuloPapel = papel === 'gestor' ? 'Gestor' : 'Funcionário'

  async function validar(pinCompleto: string) {
    if (!papel) return
    setEnviando(true)
    try {
      await entrarComPin(papel, pinCompleto)
      resetar()
      desbloquear()
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
    if (next.length === 6) validar(next)
  }

  const mensagem = bloqueado ? `Muitas tentativas. Aguarde ${segundosRestantes}s` : erro

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-6 anim-fade" style={{ background: 'var(--bg-app)' }}>
      <div className="w-full max-w-xs">
        {/* Cadeado */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: GRAD, boxShadow: '0 8px 24px rgba(240,70,78,.4)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div className="text-center">
            <div className="text-base font-extrabold" style={{ color: 'var(--orange)' }}>Tela bloqueada</div>
            <div className="mt-0.5 text-xs font-semibold text-white/40">
              Digite o PIN de {rotuloPapel} para continuar
            </div>
          </div>
        </div>

        <TecladoPin pin={pin} onChange={aoMudar} desabilitado={enviando || bloqueado} />

        <div className="mt-3 h-5 text-center text-sm font-bold" style={{ color: 'var(--red)' }}>
          {mensagem ?? ''}
        </div>

        <button
          onClick={() => void sair()}
          className="mt-4 w-full text-center text-sm font-semibold text-white/45 hover:text-white/70"
        >
          Sair e trocar de conta
        </button>
      </div>
    </div>
  )
}
