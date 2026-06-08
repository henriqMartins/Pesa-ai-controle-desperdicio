/**
 * Alimento cadastrado pela dona.
 * Espelha a tabela `alimentos` do schema (supabase/schema.sql).
 */
export interface Alimento {
  id: string
  nome: string
  categoria: string | null
  valor_por_kg: number
  ativo: boolean
  criado_em: string
}

/** Campos necessários para criar um novo alimento (o banco preenche o resto). */
export type NovoAlimento = Pick<Alimento, 'nome' | 'valor_por_kg'> &
  Partial<Pick<Alimento, 'categoria' | 'ativo'>>
