import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ProtectedRoute } from './ProtectedRoute'

// Gating de navegação: sem sessão mostra a TelaPin; com sessão, o conteúdo.
// A TelaPin real é stubada para não puxar a cadeia do Supabase no teste.

const useSessao = vi.fn()
vi.mock('../hooks/useSessao', () => ({ useSessao: () => useSessao() }))
vi.mock('./TelaPin', () => ({ default: () => <div>tela-pin</div> }))

afterEach(cleanup)

describe('ProtectedRoute', () => {
  it('sem sessão renderiza a TelaPin', () => {
    useSessao.mockReturnValue({ session: null, carregando: false })
    render(
      <ProtectedRoute>
        <div>conteudo-protegido</div>
      </ProtectedRoute>,
    )
    expect(screen.getByText('tela-pin')).toBeInTheDocument()
    expect(screen.queryByText('conteudo-protegido')).toBeNull()
  })

  it('com sessão renderiza o conteúdo protegido', () => {
    useSessao.mockReturnValue({ session: { user: {} }, carregando: false })
    render(
      <ProtectedRoute>
        <div>conteudo-protegido</div>
      </ProtectedRoute>,
    )
    expect(screen.getByText('conteudo-protegido')).toBeInTheDocument()
    expect(screen.queryByText('tela-pin')).toBeNull()
  })

  it('enquanto carrega não mostra TelaPin nem conteúdo', () => {
    useSessao.mockReturnValue({ session: null, carregando: true })
    render(
      <ProtectedRoute>
        <div>conteudo-protegido</div>
      </ProtectedRoute>,
    )
    expect(screen.queryByText('tela-pin')).toBeNull()
    expect(screen.queryByText('conteudo-protegido')).toBeNull()
  })
})
