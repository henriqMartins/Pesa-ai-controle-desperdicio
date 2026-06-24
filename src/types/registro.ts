import type { UnidadeBase } from '../lib/unidades'

export interface Registro {
  id: string
  alimento_id: string
  funcionario_id: string
  quantidade: number
  unidade_registro: string
  preco_unitario_no_momento: number
  custo: number
  motivo: string | null
  criado_em: string
}

export type NovoRegistro = Pick<
  Registro,
  | 'alimento_id'
  | 'funcionario_id'
  | 'quantidade'
  | 'unidade_registro'
  | 'preco_unitario_no_momento'
> &
  Partial<Pick<Registro, 'motivo'>>

export interface RegistroCompleto extends Registro {
  alimentos: { nome: string; unidade: UnidadeBase }
  funcionarios: { nome: string }
}
