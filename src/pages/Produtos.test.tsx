import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import Produtos from './Produtos'

// Foca no excluir com bloqueio por FK: quando o produto tem lançamentos
// vinculados, o hook lança uma mensagem amigável e a tela a exibe (em vez de
// apagar e destruir o histórico). Os dados são mockados.

const excluir = vi.fn()
vi.mock('../hooks/useAlimentos', () => ({
  useAlimentos: () => ({
    alimentos: [
      { id: 'a1', nome: 'Frango', categoria: null, preco_por_unidade: 30, unidade: 'kg', ativo: true, criado_em: '' },
    ],
    loading: false,
    error: null,
    adicionar: vi.fn(),
    atualizar: vi.fn(),
    excluir,
    recarregar: vi.fn(),
  }),
}))

beforeEach(() => vi.clearAllMocks())
afterEach(cleanup)

describe('Produtos — excluir', () => {
  it('mostra o botão "Excluir produto" ao editar', () => {
    render(<Produtos />)
    fireEvent.click(screen.getByText('Frango')) // abre o modal de edição
    expect(screen.getByRole('button', { name: 'Excluir produto' })).toBeInTheDocument()
  })

  it('avisa (sem apagar) quando o produto tem lançamentos vinculados', async () => {
    excluir.mockRejectedValue(
      new Error('Este produto tem lançamentos vinculados. Desative-o em vez de excluir.'),
    )
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<Produtos />)
    fireEvent.click(screen.getByText('Frango'))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir produto' }))

    expect(await screen.findByText(/lançamentos vinculados/i)).toBeInTheDocument()
    expect(excluir).toHaveBeenCalledWith('a1')
  })
})
