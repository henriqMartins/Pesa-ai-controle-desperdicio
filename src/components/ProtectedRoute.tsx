import type { ReactNode } from 'react'
import { useSessao } from '../hooks/useSessao'
import { useLock } from '../hooks/useLock'
import TelaPin from './TelaPin'
import LockOverlay from './LockOverlay'

/**
 * Portão de autenticação. Sem sessão → TelaPin; com sessão → conteúdo (com o
 * LockOverlay por cima quando bloqueado, mantendo o app montado por baixo).
 *
 * ⚠️ Gating de navegação/UX. A proteção REAL dos dados é o RLS por papel
 * (Fase 2). Ver docs/plano-seguranca.md.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, carregando } = useSessao()
  const { locked } = useLock()
  // Enquanto o getSession inicial não responde, não pisca a TelaPin.
  if (carregando) return <div className="min-h-full bg-app" />
  if (!session) return <TelaPin />
  return (
    <>
      {children}
      {locked && <LockOverlay session={session} />}
    </>
  )
}
