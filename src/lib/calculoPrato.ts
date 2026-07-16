// Cálculo de custo e precificação de pratos (ficha técnica).
// Fórmulas do README §8 ("Cálculo de custo por ingrediente / do prato").
//
// Opera sobre os VIEW-MODELS (campos string, com máscara decimal) para permitir
// o recálculo ao vivo enquanto a gestora digita — o mesmo dado que a UI mantém.
// A conversão de/para o formato do banco vive em src/lib/mapPrato.ts.

import type { IngredientePrato, Prato, ResultadoCalculo } from '../components/pratos/tipos'

/** "12,50" → 12.5 · vazio/inválido → 0 (mesmo espírito do form de Produtos). */
export function num(s: string): number {
  const n = parseFloat((s ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export function brl(valor: number): string {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`
}

/** Custo antes da perda. kg/L: valor por kg/L e qtd em g/mL → ÷ 1000. */
export function custoBaseIngrediente(ing: IngredientePrato): number {
  const divisor = ing.tipo === 'kg' || ing.tipo === 'L' ? 1000 : 1
  return (num(ing.valor) * num(ing.qtd)) / divisor
}

/** Perda em % (0..100) ou null enquanto os dois pesos não estiverem preenchidos. */
export function perdaPct(ing: IngredientePrato): number | null {
  const bruto = num(ing.pesoBrutoKg)
  const liquido = num(ing.pesoLiquidoKg)
  if (bruto <= 0 || liquido <= 0) return null
  return ((bruto - liquido) / bruto) * 100
}

/**
 * Custo final do ingrediente: quando a perda está ativa e ambos os pesos estão
 * preenchidos, encarece proporcionalmente (paga o bruto, rende o líquido).
 * Sem perda, usa o custo base.
 */
export function custoFinalIngrediente(ing: IngredientePrato, calcularPerda: boolean): number {
  const base = custoBaseIngrediente(ing)
  const bruto = num(ing.pesoBrutoKg)
  const liquido = num(ing.pesoLiquidoKg)
  if (calcularPerda && bruto > 0 && liquido > 0) return base * (bruto / liquido)
  return base
}

export function calcularPrato(prato: Prato): ResultadoCalculo {
  const custoIngredientes = prato.ingredientes.reduce(
    (s, ing) => s + custoFinalIngrediente(ing, prato.calcularPerda),
    0,
  )
  const embalagem = num(prato.embalagem)
  const totalCusto = custoIngredientes + embalagem
  const margem = num(prato.margem)
  const precoSugerido = totalCusto * (1 + margem / 100)
  const markup = totalCusto > 0 ? precoSugerido / totalCusto : 0
  const margemVenda = precoSugerido > 0 ? (precoSugerido - totalCusto) / precoSugerido : 0
  return { custoIngredientes, embalagem, totalCusto, precoSugerido, markup, margemVenda }
}

// Limiar de alerta de perda (%): a UI pinta a perda de vermelho acima disto.
export const LIMIAR_PERDA = 15
