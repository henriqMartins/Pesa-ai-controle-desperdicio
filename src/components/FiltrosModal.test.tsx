import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import FiltrosModal from './FiltrosModal'
import type { RegistroCompleto } from '../types'

// Verifica a superfície de runtime do modal de filtros avançados: troca entre os
// 3 modos, seletor de período e estados. Os dados vêm mockados (sem Supabase);
// a lógica de agregação em si já é coberta por lib/filtros.test.ts.

function reg(over: {
  id: string
  alimento: string
  custo: number
  quando: string
  motivo?: string
}): RegistroCompleto {
  return {
    id: over.id,
    alimento_id: 'a',
    funcionario_id: 'f',
    quantidade: 2,
    unidade_registro: 'un',
    preco_unitario_no_momento: over.custo,
    custo: over.custo,
    motivo: over.motivo ?? null,
    criado_em: over.quando,
    alimentos: { nome: over.alimento, unidade: 'un' },
    funcionarios: { nome: 'Maria' },
  } as RegistroCompleto
}

const REGISTROS = [
  reg({ id: '1', alimento: 'Pão brioche', custo: 16.2, quando: '2026-06-30T14:10:00Z', motivo: 'Erro de montagem' }),
  reg({ id: '2', alimento: 'Pão brioche', custo: 12.15, quando: '2026-06-27T22:30:00Z' }),
  reg({ id: '3', alimento: 'X-Bacon', custo: 32, quando: '2026-06-25T15:10:00Z', motivo: 'Validade vencida' }),
  reg({ id: '4', alimento: 'X-Bacon', custo: 16, quando: '2026-07-02T15:05:00Z' }),
]

vi.mock('../hooks/useIsMobile', () => ({ useIsMobile: () => false }))
vi.mock('../hooks/useRegistrosPeriodo', () => ({
  useRegistrosPeriodo: () => ({ registros: REGISTROS, loading: false, erro: null, recarregar: vi.fn() }),
}))

afterEach(cleanup)

describe('FiltrosModal', () => {
  it('abre no modo "Mais registrados" e ranqueia por ocorrências', () => {
    render(<FiltrosModal onClose={() => {}} />)
    expect(screen.getByText(/MAIS REGISTRADOS · ÚLTIMOS 30 DIAS/i)).toBeTruthy()
    // Pão brioche e X-Bacon têm 2 ocorrências cada → ambos aparecem.
    expect(screen.getByText('Pão brioche')).toBeTruthy()
    expect(screen.getAllByText(/2 registros/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/valor total:/).length).toBe(2)
  })

  it('troca para "Maior valor" e destaca o maior registro individual', () => {
    render(<FiltrosModal onClose={() => {}} />)
    fireEvent.click(screen.getByText('Maior valor'))
    expect(screen.getByText(/Maior registro/i)).toBeTruthy()
    // O maior custo individual é R$ 32,00 (X-Bacon).
    expect(screen.getAllByText('R$ 32,00').length).toBeGreaterThan(0)
    // "Validade vencida" aparece no card-herói e na linha #1 (o herói é o 1º).
    expect(screen.getAllByText(/Validade vencida/).length).toBeGreaterThan(0)
  })

  it('no modo "Por produto" lista as datas e soma o total do produto', () => {
    render(<FiltrosModal onClose={() => {}} />)
    fireEvent.click(screen.getByText('Por produto'))
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'X-Bacon' } })
    // 2 registros de X-Bacon; total 32 + 16 = 48,00.
    expect(screen.getByText(/2 registros/)).toBeTruthy()
    expect(screen.getByText('R$ 48,00')).toBeTruthy()
  })

  it('atualiza o rótulo do período ao trocar o recorte', () => {
    render(<FiltrosModal onClose={() => {}} />)
    fireEvent.click(screen.getByText('7 dias'))
    expect(screen.getByText(/ÚLTIMOS 7 DIAS/i)).toBeTruthy()
  })

  it('fecha pelo botão "Fechar"', () => {
    const onClose = vi.fn()
    render(<FiltrosModal onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('mantém o recorte ao alternar modos (não some o resultado)', () => {
    render(<FiltrosModal onClose={() => {}} />)
    fireEvent.click(screen.getByText('Maior valor'))
    fireEvent.click(screen.getByText('Mais registrados'))
    // A legenda (caixa de resultado) continua presente com os dados.
    const caption = screen.getByText('MAIS REGISTRADOS · ÚLTIMOS 30 DIAS')
    const caixa = caption.parentElement as HTMLElement
    expect(within(caixa).getByText('Pão brioche')).toBeTruthy()
  })
})
