import { useSyncExternalStore } from 'react'
import { supabase } from '../lib/supabase'

// Estado de "tela bloqueada" (Fase 3) como store de módulo — compartilhado entre
// o botão Bloquear (header) e o ProtectedRoute (que mostra o LockOverlay), sem
// precisar de Provider. Diferente do logout: a sessão do Supabase segue viva; só
// cobrimos a UI. Persiste em localStorage para sobreviver a um reload.

const KEY = 'app_locked'

const listeners = new Set<() => void>()
function emitir() {
  listeners.forEach((l) => l())
}
function subscrever(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
function snapshot() {
  return localStorage.getItem(KEY) === '1'
}

/** Cobre a tela com o LockOverlay (não derruba a sessão). */
export function lockar() {
  localStorage.setItem(KEY, '1')
  emitir()
}

/** Remove o bloqueio (chamar após revalidar o PIN). */
export function desbloquear() {
  localStorage.removeItem(KEY)
  emitir()
}

// Logout limpa o lock — senão o flag persistiria e o próximo login já entraria
// bloqueado. Assinatura única no nível do módulo (singleton do app).
supabase.auth.onAuthStateChange((evento) => {
  if (evento === 'SIGNED_OUT') {
    localStorage.removeItem(KEY)
    emitir()
  }
})

export function useLock() {
  const locked = useSyncExternalStore(subscrever, snapshot)
  return { locked, lockar, desbloquear }
}
