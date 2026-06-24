import type { UnidadeBase } from '../lib/unidades'

export interface Alimento {
  id: string
  nome: string
  categoria: string | null
  preco_por_unidade: number
  unidade: UnidadeBase
  ativo: boolean
  criado_em: string
}

export type NovoAlimento = Pick<Alimento, 'nome' | 'preco_por_unidade' | 'unidade'> &
  Partial<Pick<Alimento, 'categoria' | 'ativo'>>
