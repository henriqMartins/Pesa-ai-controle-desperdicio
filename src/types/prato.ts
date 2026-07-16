// Tipos canônicos (formato do banco) das tabelas `pratos` e `prato_ingredientes`.
// A camada VISUAL usa view-models com campos string (máscara decimal) em
// src/components/pratos/tipos.ts; a conversão entre os dois vive em
// src/lib/mapPrato.ts. Ver docs/plano-tela-pratos-logica.md e modelo-dados.md.

export type TipoIngredientePrato = 'fixo' | 'kg' | 'g' | 'L' | 'mL' | 'un'

export interface PratoIngrediente {
  id: string
  prato_id: string
  posicao: number
  nome: string
  tipo: TipoIngredientePrato
  valor: number
  qtd: number
  peso_bruto_kg: number | null
  peso_liquido_kg: number | null
}

export interface Prato {
  id: string
  nome: string
  calcular_perda: boolean
  embalagem: number
  margem_pct: number
  ativo: boolean
  criado_em: string
  // vem do join `pratos.select('*, prato_ingredientes(*)')`
  prato_ingredientes?: PratoIngrediente[]
}

// Payload aceito pela função RPC `salvar_prato` (ver supabase/criar_tabelas_pratos.sql).
export interface IngredientePayload {
  posicao: number
  nome: string
  tipo: TipoIngredientePrato
  valor: number
  qtd: number
  peso_bruto_kg: number | null
  peso_liquido_kg: number | null
}

export interface PratoPayload {
  id: string | null // null = novo prato (o banco gera o uuid)
  nome: string
  calcular_perda: boolean
  embalagem: number
  margem_pct: number
  ingredientes: IngredientePayload[]
}
