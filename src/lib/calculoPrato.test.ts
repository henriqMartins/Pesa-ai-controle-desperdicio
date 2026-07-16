import { describe, it, expect } from 'vitest'
import {
  num,
  brl,
  custoBaseIngrediente,
  perdaPct,
  custoFinalIngrediente,
  calcularPrato,
  LIMIAR_PERDA,
} from './calculoPrato'
import type { IngredientePrato, Prato } from '../components/pratos/tipos'

// Fábrica de ingrediente para os testes; sobrescreva o que importar.
function ing(over: Partial<IngredientePrato> = {}): IngredientePrato {
  return {
    id: 'i',
    nome: '',
    tipo: 'un',
    valor: '',
    qtd: '',
    pesoBrutoKg: '',
    pesoLiquidoKg: '',
    ...over,
  }
}

function prato(over: Partial<Prato> = {}): Prato {
  return {
    id: 'p',
    nome: 'Teste',
    calcularPerda: false,
    ingredientes: [],
    embalagem: '',
    margem: '',
    ...over,
  }
}

describe('num', () => {
  it('converte vírgula decimal e trata vazio/inválido como 0', () => {
    expect(num('12,50')).toBe(12.5)
    expect(num('38')).toBe(38)
    expect(num('')).toBe(0)
    expect(num('abc')).toBe(0)
  })
})

describe('brl', () => {
  it('formata com R$ e vírgula, 2 casas', () => {
    expect(brl(17.16)).toBe('R$ 17,16')
    expect(brl(0)).toBe('R$ 0,00')
  })
})

describe('custoBaseIngrediente', () => {
  it('unidade / grama / mL: valor × qtd direto', () => {
    expect(custoBaseIngrediente(ing({ tipo: 'un', valor: '1,50', qtd: '2' }))).toBe(3)
    expect(custoBaseIngrediente(ing({ tipo: 'g', valor: '0,04', qtd: '80' }))).toBeCloseTo(3.2, 5)
  })

  it('kg / L: divide por 1000 (qtd em g/mL)', () => {
    // 38 R$/kg × 300 g = 11,40
    expect(custoBaseIngrediente(ing({ tipo: 'kg', valor: '38', qtd: '300' }))).toBeCloseTo(11.4, 5)
    // 20 R$/L × 150 mL = 3,00
    expect(custoBaseIngrediente(ing({ tipo: 'L', valor: '20', qtd: '150' }))).toBeCloseTo(3, 5)
  })

  it('custo fixo: valor × qtd sem divisão', () => {
    expect(custoBaseIngrediente(ing({ tipo: 'fixo', valor: '5', qtd: '1' }))).toBe(5)
  })
})

describe('perdaPct', () => {
  it('null enquanto os dois pesos não estão preenchidos', () => {
    expect(perdaPct(ing({ pesoBrutoKg: '1,2', pesoLiquidoKg: '' }))).toBeNull()
    expect(perdaPct(ing({ pesoBrutoKg: '', pesoLiquidoKg: '0,9' }))).toBeNull()
  })

  it('calcula ((bruto - líquido) / bruto) × 100', () => {
    expect(perdaPct(ing({ pesoBrutoKg: '1,2', pesoLiquidoKg: '0,9' }))).toBeCloseTo(25, 5)
  })
})

describe('custoFinalIngrediente', () => {
  it('sem perda ativa: igual ao custo base', () => {
    const i = ing({ tipo: 'kg', valor: '38', qtd: '300', pesoBrutoKg: '1,2', pesoLiquidoKg: '0,9' })
    expect(custoFinalIngrediente(i, false)).toBeCloseTo(11.4, 5)
  })

  it('com perda ativa: encarece por bruto/líquido', () => {
    const i = ing({ tipo: 'kg', valor: '38', qtd: '300', pesoBrutoKg: '1,2', pesoLiquidoKg: '0,9' })
    // 11,40 × (1,2 / 0,9) = 15,20
    expect(custoFinalIngrediente(i, true)).toBeCloseTo(15.2, 5)
  })

  it('perda ativa mas sem pesos: usa o custo base', () => {
    const i = ing({ tipo: 'un', valor: '2', qtd: '3' })
    expect(custoFinalIngrediente(i, true)).toBe(6)
  })
})

describe('calcularPrato', () => {
  it('soma ingredientes + embalagem e aplica a margem', () => {
    const p = prato({
      embalagem: '2,00',
      margem: '150',
      ingredientes: [
        ing({ tipo: 'un', valor: '5', qtd: '1' }), // 5,00
        ing({ tipo: 'g', valor: '0,04', qtd: '250' }), // 10,00
      ],
    })
    const r = calcularPrato(p)
    expect(r.custoIngredientes).toBeCloseTo(15, 5)
    expect(r.embalagem).toBe(2)
    expect(r.totalCusto).toBeCloseTo(17, 5)
    expect(r.precoSugerido).toBeCloseTo(42.5, 5) // 17 × 2,5
    expect(r.markup).toBeCloseTo(2.5, 5)
    expect(r.margemVenda).toBeCloseTo(0.6, 5) // (42,5 - 17) / 42,5
  })

  it('considera a perda quando o toggle está ativo', () => {
    const p = prato({
      calcularPerda: true,
      margem: '0',
      ingredientes: [ing({ tipo: 'kg', valor: '38', qtd: '300', pesoBrutoKg: '1,2', pesoLiquidoKg: '0,9' })],
    })
    const r = calcularPrato(p)
    expect(r.totalCusto).toBeCloseTo(15.2, 5)
    expect(r.precoSugerido).toBeCloseTo(15.2, 5) // margem 0
  })

  it('custo zero não gera divisão por zero em markup/margem', () => {
    const r = calcularPrato(prato())
    expect(r.totalCusto).toBe(0)
    expect(r.precoSugerido).toBe(0)
    expect(r.markup).toBe(0)
    expect(r.margemVenda).toBe(0)
  })
})

describe('LIMIAR_PERDA', () => {
  it('default de alerta é 15%', () => {
    expect(LIMIAR_PERDA).toBe(15)
  })
})
