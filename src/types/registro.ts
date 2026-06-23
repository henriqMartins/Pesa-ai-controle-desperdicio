export interface Registro {
  id: string
  alimento_id: string
  funcionario_id: string
  peso_g: number
  // snapshot do preço no momento do registro — garante que relatórios antigos não mudem
  preco_kg_no_momento: number
  // coluna GERADA pelo banco: round((peso_g / 1000) * preco_kg_no_momento, 2)
  custo: number
  motivo: string | null
  criado_em: string
}

// Campos enviados pelo cliente — custo é omitido (banco calcula)
export type NovoRegistro = Pick<
  Registro,
  'alimento_id' | 'funcionario_id' | 'peso_g' | 'preco_kg_no_momento'
> &
  Partial<Pick<Registro, 'motivo'>>

// Registro com nomes resolvidos (join com alimentos + funcionarios)
export interface RegistroCompleto extends Registro {
  alimentos: { nome: string }
  funcionarios: { nome: string }
}
