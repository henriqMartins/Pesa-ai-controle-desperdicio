/**
 * Registro de desperdício.
 * Espelha a tabela `registros` do schema (supabase/schema.sql).
 *
 * - `preco_kg_no_momento` guarda o preço no instante do registro (snapshot),
 *   para que relatórios antigos não sejam recalculados com o preço de hoje.
 * - `custo` é uma coluna GERADA pelo banco; nunca é enviada pelo cliente.
 */
export interface Registro {
  id: string
  alimento_id: string
  funcionario_id: string
  peso_g: number
  preco_kg_no_momento: number
  /** Calculado pelo banco: round((peso_g / 1000) * preco_kg_no_momento, 2). */
  custo: number
  motivo: string | null
  criado_em: string
}

/**
 * Campos enviados pelo cliente ao criar um registro.
 * `custo` é omitido de propósito (coluna gerada pelo banco).
 */
export type NovoRegistro = Pick<
  Registro,
  'alimento_id' | 'funcionario_id' | 'peso_g' | 'preco_kg_no_momento'
> &
  Partial<Pick<Registro, 'motivo'>>
