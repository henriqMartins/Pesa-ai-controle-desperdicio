import { useEffect, useState } from 'react'

// Lockout de PIN (Fase 3): após muitas tentativas erradas, bloqueia o teclado
// por um tempo. É uma camada de conveniência sobre o rate limiting nativo do
// Supabase. Persiste em localStorage para que recarregar a página NÃO zere o
// contador (senão o bloqueio seria trivial de contornar).

export const MAX_TENTATIVAS = 5
export const BLOQUEIO_MS = 60_000 // 1 min

const KEY = 'pin_lockout'

interface Estado {
  tentativas: number
  /** Epoch (ms) até quando está bloqueado; 0 = sem bloqueio. */
  ateQuando: number
}

const ZERO: Estado = { tentativas: 0, ateQuando: 0 }

function ler(): Estado {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return ZERO
    const p = JSON.parse(raw)
    return { tentativas: Number(p.tentativas) || 0, ateQuando: Number(p.ateQuando) || 0 }
  } catch {
    return ZERO
  }
}

function gravar(e: Estado) {
  localStorage.setItem(KEY, JSON.stringify(e))
}

export function useLockout() {
  const [estado, setEstado] = useState<Estado>(ler)
  const [agora, setAgora] = useState(() => Date.now())

  const bloqueado = estado.ateQuando > agora
  const segundosRestantes = bloqueado ? Math.ceil((estado.ateQuando - agora) / 1000) : 0

  // Enquanto bloqueado, atualiza o relógio para a contagem regressiva na tela.
  useEffect(() => {
    if (!bloqueado) return
    const t = setInterval(() => setAgora(Date.now()), 500)
    return () => clearInterval(t)
  }, [bloqueado])

  /** Registra uma tentativa errada; ao atingir o teto, ativa o bloqueio. */
  function registrarErro() {
    const tentativas = estado.tentativas + 1
    const novo: Estado =
      tentativas >= MAX_TENTATIVAS
        ? { tentativas: 0, ateQuando: Date.now() + BLOQUEIO_MS }
        : { tentativas, ateQuando: 0 }
    gravar(novo)
    setEstado(novo)
  }

  /** Zera tudo (chamar após um login/desbloqueio bem-sucedido). */
  function resetar() {
    gravar(ZERO)
    setEstado(ZERO)
  }

  return { bloqueado, segundosRestantes, registrarErro, resetar }
}
