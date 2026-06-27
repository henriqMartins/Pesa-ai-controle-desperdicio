import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { RegistroCompleto } from '../types'

// As bibliotecas xlsx e jsPDF mexem com arquivos/binário e não rodam bem em
// teste. Substituímos as duas por "dublês" (mocks) e verificamos o que importa:
// que a exportação MONTA as linhas certas e dispara o download uma vez.

vi.mock('xlsx', () => ({
  utils: {
    book_new: vi.fn(() => ({})),
    json_to_sheet: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}))

vi.mock('jspdf', () => ({
  // Implementação com `function` (não arrow): o código usa `new jsPDF()`, e
  // arrow functions não podem ser usadas como construtor.
  jsPDF: vi.fn(function () {
    return {
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      addPage: vi.fn(),
      save: vi.fn(),
    }
  }),
}))

import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import { exportarExcel, exportarPDF } from './exportar'

function registro(over: Partial<RegistroCompleto> = {}): RegistroCompleto {
  return {
    id: '1',
    alimento_id: 'a',
    funcionario_id: 'f',
    quantidade: 0.5, // 0,5 kg
    unidade_registro: 'g', // digitado em gramas
    preco_unitario_no_momento: 20,
    custo: 10,
    motivo: 'Sobra',
    criado_em: '2026-06-20T13:30:00.000Z',
    alimentos: { nome: 'Frango', unidade: 'kg' },
    funcionarios: { nome: 'Maria' },
    ...over,
  } as RegistroCompleto
}

const dados = {
  registros: [registro()],
  topAlimentos: [
    { nome: 'Frango', total: 10, quantidadeTotal: 0.5, unidade: 'kg' as const, quantidade: 1 },
  ],
  ranking: [{ nome: 'Maria', total: 10, quantidade: 1 }],
  total: 10,
  label: 'junho de 2026',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('exportarExcel', () => {
  it('cria as 3 abas (Registros, Top Alimentos, Ranking)', () => {
    exportarExcel(dados)
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledTimes(3)
    const abas = vi.mocked(XLSX.utils.book_append_sheet).mock.calls.map((c) => c[2])
    expect(abas).toEqual(['Registros', 'Top Alimentos', 'Ranking'])
  })

  it('mapeia a linha de registro com a quantidade reexibida na unidade digitada', () => {
    exportarExcel(dados)
    const linhasRegistros = vi.mocked(XLSX.utils.json_to_sheet).mock.calls[0][0] as Array<
      Record<string, unknown>
    >
    expect(linhasRegistros[0]).toMatchObject({
      Alimento: 'Frango',
      Quantidade: '500 g', // 0,5 kg gravado, digitado em g
      'Custo (R$)': 10,
      Funcionário: 'Maria',
      Motivo: 'Sobra',
    })
  })

  it('baixa um arquivo .xlsx com o período no nome', () => {
    exportarExcel(dados)
    expect(XLSX.writeFile).toHaveBeenCalledTimes(1)
    const nome = vi.mocked(XLSX.writeFile).mock.calls[0][1]
    expect(nome).toMatch(/^desperdicio-.*\.xlsx$/)
  })
})

describe('exportarPDF', () => {
  it('gera o documento e dispara o download .pdf uma vez', () => {
    exportarPDF(dados)
    const instancia = vi.mocked(jsPDF).mock.results[0].value
    expect(instancia.save).toHaveBeenCalledTimes(1)
    expect(instancia.save).toHaveBeenCalledWith(expect.stringMatching(/\.pdf$/))
  })
})
