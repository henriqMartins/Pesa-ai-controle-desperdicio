import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import type { Session } from '@supabase/supabase-js'
import LockOverlay from './LockOverlay'

// Desbloqueio: revalida o PIN do papel DA SESSÃO (recebida por prop) e libera no
// sucesso. Regressão coberta: antes o papel vinha de um useSessao próprio que
// começava null → o validar saía calado e o PIN travava preenchido.

const verificarPin = vi.fn()
const desbloquear = vi.fn()

vi.mock('../lib/auth', async (importOriginal) => {
  const real = await importOriginal<typeof import('../lib/auth')>()
  return { ...real, verificarPin: (...a: unknown[]) => verificarPin(...a) }
})
vi.mock('../hooks/useLock', () => ({
  useLock: () => ({ locked: true, lockar: vi.fn(), desbloquear }),
}))

function sessao(papel: string): Session {
  return { user: { app_metadata: { papel } } } as unknown as Session
}
function digitar(seq: string) {
  for (const d of seq) fireEvent.click(screen.getByRole('button', { name: d }))
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})
afterEach(cleanup)

describe('LockOverlay', () => {
  it('confere o PIN do papel da sessão e desbloqueia no sucesso', async () => {
    verificarPin.mockResolvedValue(undefined)
    render(<LockOverlay session={sessao('gestor')} />)
    digitar('123456')
    await waitFor(() => expect(verificarPin).toHaveBeenCalledWith('gestor', '123456'))
    await waitFor(() => expect(desbloquear).toHaveBeenCalled())
  })

  it('mostra erro e não desbloqueia com PIN errado', async () => {
    verificarPin.mockRejectedValue(new Error('bad'))
    render(<LockOverlay session={sessao('funcionario')} />)
    digitar('000000')
    expect(await screen.findByText('PIN incorreto')).toBeInTheDocument()
    expect(desbloquear).not.toHaveBeenCalled()
  })
})
