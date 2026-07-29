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

/**
 * true quando o MENOR lado da viewport está abaixo do breakpoint — isto é,
 * "o aparelho é pequeno", em pé ou deitado.
 *
 * Existe separado de `useIsMobile` (que olha só a largura, e por isso muda ao
 * girar) porque decidir o travamento de orientação por largura cria um ciclo:
 * trava em paisagem → a largura cresce → "não é mais mobile" → destrava →
 * o aparelho volta a retrato → trava de novo, indefinidamente.
 */
export function useEhCelular(breakpoint = 640) {
  const ler = () => Math.min(window.innerWidth, window.innerHeight) < breakpoint
  const [ehCelular, setEhCelular] = useState(
    () => typeof window !== 'undefined' && ler(),
  )

  useEffect(() => {
    const atualizar = () => setEhCelular(ler())
    // `resize` cobre também a troca de orientação (o menor lado só muda de fato
    // quando o aparelho muda, não quando gira).
    window.addEventListener('resize', atualizar)
    return () => window.removeEventListener('resize', atualizar)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakpoint])

  return ehCelular
}
