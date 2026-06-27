import { useEffect, useState } from 'react'

/** true quando a largura da viewport está abaixo do breakpoint (padrão 640px = sm). */
export function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < breakpoint,
  )

  useEffect(() => {
    // Estado inicial já vem do inicializador acima; aqui só assinamos mudanças
    // (setState fica no callback da subscription, não no corpo síncrono do efeito).
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [breakpoint])

  return isMobile
}
