export type UnidadeBase = 'kg' | 'L' | 'un'
export type UnidadeEntrada = 'g' | 'kg' | 'mL' | 'L' | 'un'

export interface OpcaoUnidade {
  label: string
  fator: number // multiplica o valor inserido para converter à unidade-base
}

export const UNIDADES_ENTRADA: Record<UnidadeBase, OpcaoUnidade[]> = {
  kg: [
    { label: 'g',  fator: 0.001 },
    { label: 'kg', fator: 1 },
  ],
  L: [
    { label: 'mL', fator: 0.001 },
    { label: 'L',  fator: 1 },
  ],
  un: [
    { label: 'un', fator: 1 },
  ],
}

export const OPCOES_UNIDADE_BASE: { value: UnidadeBase; label: string }[] = [
  { value: 'kg', label: 'kg — preço por quilo' },
  { value: 'L',  label: 'L — preço por litro' },
  { value: 'un', label: 'un — preço por unidade' },
]

const FATORES: Record<string, number> = {
  g: 0.001, kg: 1, mL: 0.001, L: 1, un: 1,
}

/** Converte o valor inserido pelo usuário para a unidade-base do produto. */
export function converterParaBase(valor: number, unidadeEntrada: string): number {
  return valor * (FATORES[unidadeEntrada] ?? 1)
}

/**
 * Reconstrói a quantidade exibível a partir do valor armazenado (base) e da
 * unidade com que o usuário fez o registro.
 */
export function formatarQuantidade(quantidadeBase: number, unidadeRegistro: string): string {
  const fator = FATORES[unidadeRegistro] ?? 1
  const display = quantidadeBase / fator

  if (unidadeRegistro === 'un') return `${Math.round(display)} un`
  if (unidadeRegistro === 'g' || unidadeRegistro === 'mL') return `${Math.round(display)} ${unidadeRegistro}`
  // kg ou L
  return `${display.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} ${unidadeRegistro}`
}
