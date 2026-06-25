export interface Motivo {
  id: string
  texto: string
  ativo: boolean
  criado_em: string
}

export type NovoMotivo = Pick<Motivo, 'texto'> & Partial<Pick<Motivo, 'ativo'>>
