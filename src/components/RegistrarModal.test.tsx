import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import RegistrarModal from './RegistrarModal'

// Fluxo crítico do app: registrar um desperdício. É o caminho que mais roda no
// dia a dia, então cobrimos a jornada completa (escolher funcionário → alimento
// → quantidade → confirmar) e, principalmente, a CONVERSÃO de unidade e o
// snapshot de preço que vão para o banco — onde um erro custaria dinheiro errado
// nos relatórios. Os hooks de dados são mockados; o que importa aqui é a UI e o
// payload entregue a `inserir`.

const inserir = vi.fn().mockResolvedValue(undefined)
const atualizar = vi.fn().mockResolvedValue(undefined)
const selecionar = vi.fn()
const adicionarMotivo = vi.fn()

vi.mock('../hooks/useIsMobile', () => ({ useIsMobile: () => false }))
vi.mock('../hooks/useAlimentos', () => ({
  useAlimentos: () => ({
    alimentos: [
      { id: 'a1', nome: 'Frango', categoria: null, preco_por_unidade: 30, unidade: 'kg', ativo: true, criado_em: '' },
      { id: 'a2', nome: 'Refrigerante', categoria: null, preco_por_unidade: 8, unidade: 'L', ativo: true, criado_em: '' },
    ],
    loading: false,
    error: null,
  }),
}))
vi.mock('../hooks/useFuncionarios', () => ({
  useFuncionarios: () => ({
    funcionarios: [{ id: 'f1', nome: 'Maria', papel: 'funcionario', ativo: true, criado_em: '' }],
    loading: false,
    error: null,
  }),
}))
vi.mock('../hooks/useFuncionarioAtual', () => ({
  useFuncionarioAtual: () => ({ funcionarioId: null, selecionar }),
}))
vi.mock('../hooks/useRegistros', () => ({
  useRegistros: () => ({ inserir, atualizar }),
}))
vi.mock('../hooks/useMotivos', () => ({
  useMotivos: () => ({ motivos: [{ id: 'm1', texto: 'Sobra', ativo: true, criado_em: '' }], adicionar: adicionarMotivo }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

// Sem `globals: true` no Vitest, o cleanup automático do Testing Library não é
// registrado — então limpamos o DOM entre os testes manualmente.
afterEach(() => {
  cleanup()
})

describe('RegistrarModal', () => {
  it('registra um desperdício convertendo a quantidade para a unidade base', async () => {
    const onClose = vi.fn()
    const onRegistrado = vi.fn()
    render(<RegistrarModal onClose={onClose} onRegistrado={onRegistrado} />)

    // Funcionário
    fireEvent.click(screen.getByRole('button', { name: 'Maria' }))
    expect(selecionar).toHaveBeenCalledWith('f1')

    // Alimento (Frango, base kg → unidade de entrada inicial vira "g")
    fireEvent.click(screen.getByRole('button', { name: /Frango/ }))

    // Quantidade: 500 (g) pelo teclado numérico
    fireEvent.click(screen.getByRole('button', { name: '5' }))
    fireEvent.click(screen.getByRole('button', { name: '0' }))
    fireEvent.click(screen.getByRole('button', { name: '0' }))

    // Motivo opcional
    fireEvent.click(screen.getByRole('button', { name: 'Sobra' }))

    // Valor calculado: 500 g = 0,5 kg × R$ 30/kg = R$ 15,00
    expect(screen.getByText('R$ 15,00')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Registrar/ }))

    await waitFor(() => expect(inserir).toHaveBeenCalledTimes(1))
    expect(inserir).toHaveBeenCalledWith({
      alimento_id: 'a1',
      funcionario_id: 'f1',
      quantidade: 0.5, // 500 g convertido para kg
      unidade_registro: 'g',
      preco_unitario_no_momento: 30, // snapshot do preço atual
      motivo: 'Sobra',
    })
    expect(atualizar).not.toHaveBeenCalled()
    await waitFor(() => expect(onRegistrado).toHaveBeenCalled())
    expect(onClose).toHaveBeenCalled()
  })

  it('mantém o botão de confirmar desabilitado até preencher os campos obrigatórios', () => {
    render(<RegistrarModal onClose={vi.fn()} />)

    const confirmar = screen.getByRole('button', { name: /Registrar/ })
    expect(confirmar).toBeDisabled() // sem funcionário/alimento/quantidade

    fireEvent.click(screen.getByRole('button', { name: 'Maria' }))
    fireEvent.click(screen.getByRole('button', { name: /Frango/ }))
    expect(confirmar).toBeDisabled() // ainda falta a quantidade

    fireEvent.click(screen.getByRole('button', { name: '1' }))
    expect(confirmar).toBeEnabled()
  })
})
