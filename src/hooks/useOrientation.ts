import { useEffect, useState } from 'react'

export type Orientacao = 'portrait' | 'landscape'

/** API de orientação ainda não tipada de forma uniforme entre navegadores. */
type ScreenOrientationLock = ScreenOrientation & {
  lock?: (orientacao: OrientationLockType) => Promise<void>
  unlock?: () => void
}

function lerOrientacao(): Orientacao {
  if (typeof window === 'undefined') return 'landscape'
  // Prefere a Screen Orientation API; cai para matchMedia quando ausente.
  const tipo = window.screen?.orientation?.type
  if (tipo) return tipo.startsWith('portrait') ? 'portrait' : 'landscape'
  return window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape'
}

/**
 * Observa a orientação da tela (retrato/paisagem) e, opcionalmente, tenta
 * travá-la — útil para painéis de TV/dashboard exibidos no celular, que ficam
 * melhores em paisagem.
 *
 * O travamento só é permitido em fullscreen e em navegadores compatíveis; por
 * isso a tentativa é refeita a cada mudança de fullscreen e falha em silêncio
 * quando o navegador recusa, deixando o layout se adaptar pela orientação lida.
 */
export function useOrientation(travarEm?: Orientacao): Orientacao {
  const [orientacao, setOrientacao] = useState<Orientacao>(lerOrientacao)

  // Mantém o estado sincronizado com a orientação real do aparelho.
  useEffect(() => {
    function atualizar() {
      setOrientacao(lerOrientacao())
    }
    const mql = window.matchMedia('(orientation: portrait)')
    mql.addEventListener('change', atualizar)
    window.addEventListener('orientationchange', atualizar)
    return () => {
      mql.removeEventListener('change', atualizar)
      window.removeEventListener('orientationchange', atualizar)
    }
  }, [])

  // Travamento adaptativo: só atua se um alvo for pedido.
  useEffect(() => {
    if (!travarEm) return
    const alvo = travarEm
    const orient = window.screen?.orientation as ScreenOrientationLock | undefined
    if (!orient?.lock) return

    function tentarTravar() {
      // O lock só vinga em fullscreen; fora dele o navegador rejeita.
      if (document.fullscreenElement) orient?.lock?.(alvo).catch(() => {})
    }

    tentarTravar()
    document.addEventListener('fullscreenchange', tentarTravar)
    return () => {
      document.removeEventListener('fullscreenchange', tentarTravar)
      orient?.unlock?.()
    }
  }, [travarEm])

  return orientacao
}
