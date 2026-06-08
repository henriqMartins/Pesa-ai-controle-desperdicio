/**
 * Papel do funcionário. O ranking de desperdício é visível apenas para 'gestor'.
 */
export type PapelFuncionario = 'funcionario' | 'gestor'

/**
 * Funcionário usado no login simples (nome + PIN) e na atribuição do registro.
 * Espelha a tabela `funcionarios` do schema (supabase/schema.sql).
 */
export interface Funcionario {
  id: string
  nome: string
  /** PIN de 4 dígitos — controle leve, não segurança forte. */
  pin: string | null
  papel: PapelFuncionario
  ativo: boolean
  criado_em: string
}

/** Campos necessários para criar um novo funcionário. */
export type NovoFuncionario = Pick<Funcionario, 'nome'> &
  Partial<Pick<Funcionario, 'pin' | 'papel' | 'ativo'>>
