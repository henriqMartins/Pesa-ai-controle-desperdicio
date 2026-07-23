import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import Equipe from './Equipe'

// Gating de UX: a Equipe é gerenciável só pelo gestor. O funcionário vê a lista
// (leitura), mas sem "+ Novo" nem os botões de editar. Os dados são mockados.

vi.mock('../hooks/useFuncionarios', () => ({
  useFuncionarios: () => ({
    funcionarios: [
      { id: 'f1', nome: 'Maria', papel: 'funcionario', ativo: true, criado_em: '' },
      { id: 'f2', nome: 'João', papel: 'gestor', ativo: true, criado_em: '' },
    ],
    loading: false,
    error: null,
    adicionar: vi.fn(),
    atualizar: vi.fn(),
    excluir: vi.fn(),
    recarregar: vi.fn(),
  }),
}))

const ehGestor = vi.fn()
vi.mock('../hooks/useEhGestor', () => ({ useEhGestor: () => ehGestor() }))

afterEach(cleanup)

describe('Equipe — gating por papel', () => {
  it('funcionário vê a lista, mas sem "+ Novo" nem editar', () => {
    ehGestor.mockReturnValue(false)
    render(<Equipe />)
    expect(screen.getByText('Maria')).toBeInTheDocument() // lista visível
    expect(screen.queryByRole('button', { name: /Novo/ })).toBeNull()
    expect(screen.queryByRole('button', { name: 'editar' })).toBeNull()
  })

  it('gestor vê "+ Novo" e os botões de editar', () => {
    ehGestor.mockReturnValue(true)
    render(<Equipe />)
    expect(screen.getByRole('button', { name: /Novo/ })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'editar' }).length).toBe(2)
  })
})
