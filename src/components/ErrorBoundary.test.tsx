import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'

// Garante que um erro de render vira a tela amigável (não tela branca).

function Bomba(): never {
  throw new Error('boom')
}

afterEach(cleanup)

describe('ErrorBoundary', () => {
  it('mostra a tela de erro quando um filho quebra', () => {
    // React loga o erro no console mesmo com o boundary; silenciamos o ruído.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <Bomba />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Recarregar' })).toBeInTheDocument()
    spy.mockRestore()
  })

  it('renderiza os filhos normalmente quando não há erro', () => {
    render(
      <ErrorBoundary>
        <div>conteudo ok</div>
      </ErrorBoundary>,
    )
    expect(screen.getByText('conteudo ok')).toBeInTheDocument()
  })
})
