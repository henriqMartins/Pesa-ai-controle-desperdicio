// ─────────────────────────────────────────────────────────────────────────────
// STUB VISUAL — NÃO É A LÓGICA CANÔNICA.
//
// Existe só para a tela renderizar valores plausíveis no preview. As fórmulas
// abaixo reproduzem o README §8 ("Cálculo de custo por ingrediente / do prato"),
// mas a implementação de verdade é do AGENTE DE LÓGICA:
//   - mover para `src/lib/calculoPrato.ts` (com testes Vitest);
//   - validar limiar de perda, arredondamentos e unidades;
//   - ligar aos dados reais (usePratos + Supabase).
// Ver docs/plano-tela-pratos-logica.md.
// ─────────────────────────────────────────────────────────────────────────────

import type { IngredientePrato, Prato, ResultadoCalculo } from './tipos'

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

/** Custo final: encarece proporcional à perda quando o toggle está ativo. */
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

// Limiar de alerta de perda (%). O agente de lógica deve torná-lo ajustável.
export const LIMIAR_PERDA = 15
