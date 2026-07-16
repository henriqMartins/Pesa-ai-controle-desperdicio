// View-models da tela de Pratos (camada VISUAL).
//
// São os tipos que a UI consome. A lógica (outro agente) mantém os tipos
// canônicos do banco em `src/types/` (ex.: `Dish`/`DishIngredient` do
// README §8) e pode re-exportá-los/adaptá-los para estes. Aqui os campos de
// entrada são `string` porque espelham inputs (máscara decimal com vírgula),
// no mesmo padrão do formulário de Produtos.

export type TipoIngrediente = 'fixo' | 'kg' | 'g' | 'L' | 'mL' | 'un'

export const OPCOES_TIPO: { valor: TipoIngrediente; label: string }[] = [
  { valor: 'fixo', label: 'custo fixo' },
  { valor: 'kg', label: 'por kg' },
  { valor: 'g', label: 'por grama' },
  { valor: 'L', label: 'por litro' },
  { valor: 'mL', label: 'por mL' },
  { valor: 'un', label: 'unidade' },
]

export interface IngredientePrato {
  id: string
  nome: string
  tipo: TipoIngrediente
  valor: string // preço unitário conforme o tipo
  qtd: string // quantidade usada (g/mL quando o tipo é kg/L)
  // pesos só relevantes quando "calcular perda" está ativo
  pesoBrutoKg: string
  pesoLiquidoKg: string
}

export interface Prato {
  id: string
  nome: string
  calcularPerda: boolean // toggle global da ficha
  ingredientes: IngredientePrato[]
  embalagem: string // R$ fixo
  margem: string // % sobre o custo
}

// Resumo já calculado, entregue à UI pronto para exibir.
export interface ResultadoCalculo {
  custoIngredientes: number
  embalagem: number
  totalCusto: number
  precoSugerido: number
  markup: number // preço / custo
  margemVenda: number // (preço - custo) / preço  (fração 0..1)
}

export interface PratoResumo {
  id: string
  nome: string
  custo: number
  markup: number
  precoVenda: number
}
