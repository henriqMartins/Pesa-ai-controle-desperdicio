import { useCallback, useState } from 'react'

export type Tema = 'dark' | 'light'

function temaAtual(): Tema {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

/**
 * Lê/grava o tema na raiz do documento (data-theme) e em localStorage.
 * O tema inicial é aplicado pelo script inline em index.html (sem flash).
 */
export function useTheme() {
  const [tema, setTema] = useState<Tema>(temaAtual)

  const alternar = useCallback(() => {
    setTema((atual) => {
      const proximo: Tema = atual === 'dark' ? 'light' : 'dark'
      document.documentElement.dataset.theme = proximo
      try {
        localStorage.setItem('theme', proximo)
      } catch {
        /* ignora ambientes sem storage */
      }
      return proximo
    })
  }, [])

  return { tema, alternar }
}
