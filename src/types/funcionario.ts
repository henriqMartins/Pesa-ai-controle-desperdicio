export type PapelFuncionario = 'funcionario' | 'gestor'

export interface Funcionario {
  id: string
  nome: string
  papel: PapelFuncionario
  ativo: boolean
  criado_em: string
}

export type NovoFuncionario = Pick<Funcionario, 'nome'> &
  Partial<Pick<Funcionario, 'papel' | 'ativo'>>
