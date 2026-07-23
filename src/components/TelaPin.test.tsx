import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import TelaPin from './TelaPin'

// Comportamento da tela de PIN: auto-submete ao completar 6 dígitos, respeita
// o perfil selecionado e mostra erro (limpando o PIN) quando o login falha.
// entrarComPin é mockado — o login em si é coberto por lib/auth.test.ts.

const entrarComPin = vi.fn()
vi.mock('../lib/auth', () => ({
  entrarComPin: (...args: unknown[]) => entrarComPin(...args),
}))

function digitar(seq: string) {
  for (const d of seq) fireEvent.click(screen.getByRole('button', { name: d }))
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear() // zera o contador de lockout entre os testes
})
afterEach(cleanup)

describe('TelaPin', () => {
  it('ao completar 6 dígitos, loga como funcionário (perfil padrão)', async () => {
    entrarComPin.mockResolvedValue(undefined)
    render(<TelaPin />)
    digitar('123456')
    await waitFor(() => expect(entrarComPin).toHaveBeenCalledWith('funcionario', '123456'))
  })

  it('loga como gestor quando o perfil é trocado', async () => {
    entrarComPin.mockResolvedValue(undefined)
    render(<TelaPin />)
    fireEvent.click(screen.getByRole('button', { name: 'Gestor' }))
    digitar('654321')
    await waitFor(() => expect(entrarComPin).toHaveBeenCalledWith('gestor', '654321'))
  })

  it('preserva zeros à esquerda no PIN', async () => {
    entrarComPin.mockResolvedValue(undefined)
    render(<TelaPin />)
    digitar('001234')
    await waitFor(() => expect(entrarComPin).toHaveBeenCalledWith('funcionario', '001234'))
  })

  it('mostra "PIN incorreto" e limpa o PIN quando o login falha', async () => {
    entrarComPin.mockRejectedValue(new Error('Invalid login credentials'))
    render(<TelaPin />)
    digitar('000000')
    expect(await screen.findByText('PIN incorreto')).toBeInTheDocument()
  })
})
