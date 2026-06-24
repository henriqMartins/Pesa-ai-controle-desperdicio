export type UnidadeBase = 'kg' | 'L' | 'un'
export type UnidadeEntrada = 'g' | 'kg' | 'mL' | 'L' | 'un'

export interface OpcaoUnidade {
  valor: UnidadeEntrada
  label: string
  fator: number // quantidade digitada × fator = quantidade na unidade base
}

export const UNIDADES_ENTRADA: Record<UnidadeBase, OpcaoUnidade[]> = {
  kg: [
    { valor: 'g',  label: 'g',  fator: 0.001 },
    { valor: 'kg', label: 'kg', fator: 1 },
  ],
  L: [
    { valor: 'mL', label: 'mL', fator: 0.001 },
    { valor: 'L',  label: 'L',  fator: 1 },
  ],
  un: [
    { valor: 'un', label: 'un', fator: 1 },
  ],
}

export const OPCOES_UNIDADE_BASE: { valor: UnidadeBase; label: string }[] = [
  { valor: 'kg', label: 'kg — preço por quilo' },
  { valor: 'L',  label: 'L — preço por litro'  },
  { valor: 'un', label: 'un — preço por unidade' },
]

/** Converte quantidade digitada para a unidade base do alimento. */
export function converterParaBase(
  quantidade: number,
  unidadeEntrada: UnidadeEntrada,
  unidadeBase: UnidadeBase,
): number {
  const opcao = UNIDADES_ENTRADA[unidadeBase].find((o) => o.valor === unidadeEntrada)
  if (!opcao) throw new Error(`Unidade "${unidadeEntrada}" inválida para base "${unidadeBase}"`)
  return quantidade * opcao.fator
}

/**
 * Converte quantidade armazenada (unidade base) de volta para exibição
 * na unidade em que foi registrada.
 *
 * Exemplo: exibirQuantidade(0.5, 'g', 'kg') → "500 g"
 */
export function exibirQuantidade(
  quantidadeBase: number,
  unidadeRegistro: string,
  unidadeBase: UnidadeBase,
): string {
  const fator =
    UNIDADES_ENTRADA[unidadeBase].find((o) => o.valor === unidadeRegistro)?.fator ?? 1
  const original = quantidadeBase / fator
  const display = Number.isInteger(original)
    ? original.toFixed(0)
    : parseFloat(original.toFixed(3)).toString()
  return `${display} ${unidadeRegistro}`
}
