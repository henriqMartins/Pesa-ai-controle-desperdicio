// Conversão entre o formato do banco (números, snake_case — src/types/prato.ts)
// e o view-model da UI (campos string com máscara decimal —
// src/components/pratos/tipos.ts). A máscara com vírgula vive só na tela; o banco
// e a RPC trabalham com números.

import type {
  Prato as PratoVM,
  IngredientePrato,
} from '../components/pratos/tipos'
import type {
  Prato,
  PratoIngrediente,
  PratoPayload,
  IngredientePayload,
} from '../types'
import { num } from './calculoPrato'

/** Número → campo de formulário: inteiro sem casas, decimal com vírgula, 0 → "". */
export function numParaCampo(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n) || n === 0) return ''
  return Number.isInteger(n) ? String(n) : String(n).replace('.', ',')
}

/** Campo do form (pode estar vazio) → número ou null (para os pesos de perda). */
export function campoParaNumeroOuNull(s: string): number | null {
  return s.trim() === '' ? null : num(s)
}

function ingredienteParaVM(i: PratoIngrediente): IngredientePrato {
  return {
    id: i.id,
    nome: i.nome,
    tipo: i.tipo,
    valor: numParaCampo(i.valor),
    qtd: numParaCampo(i.qtd),
    pesoBrutoKg: numParaCampo(i.peso_bruto_kg),
    pesoLiquidoKg: numParaCampo(i.peso_liquido_kg),
  }
}

/** Linha do banco (com o join de ingredientes) → view-model consumido pela UI. */
export function pratoParaVM(p: Prato): PratoVM {
  const ingredientes = [...(p.prato_ingredientes ?? [])]
    .sort((a, b) => a.posicao - b.posicao)
    .map(ingredienteParaVM)
  return {
    id: p.id,
    nome: p.nome,
    calcularPerda: p.calcular_perda,
    embalagem: numParaCampo(p.embalagem),
    margem: numParaCampo(p.margem_pct),
    ingredientes,
  }
}

function ingredienteParaPayload(ing: IngredientePrato, posicao: number): IngredientePayload {
  return {
    posicao,
    nome: ing.nome.trim(),
    tipo: ing.tipo,
    valor: num(ing.valor),
    qtd: num(ing.qtd),
    peso_bruto_kg: campoParaNumeroOuNull(ing.pesoBrutoKg),
    peso_liquido_kg: campoParaNumeroOuNull(ing.pesoLiquidoKg),
  }
}

/**
 * View-model do form → payload da RPC `salvar_prato`.
 * `id` = null cria um prato novo (o banco gera o uuid); um uuid existente edita.
 */
export function vmParaPayload(vm: PratoVM, id: string | null): PratoPayload {
  return {
    id,
    nome: vm.nome.trim(),
    calcular_perda: vm.calcularPerda,
    embalagem: num(vm.embalagem),
    margem_pct: num(vm.margem),
    ingredientes: vm.ingredientes.map(ingredienteParaPayload),
  }
}
