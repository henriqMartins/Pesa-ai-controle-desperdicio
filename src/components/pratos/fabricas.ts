// Fábricas de view-models vazios para o formulário da ficha (ingrediente/prato
// em branco). São helpers de UI — o mock de exemplo (dadosExemplo) foi removido
// quando a tela passou a carregar de `usePratos` (Supabase).

import type { IngredientePrato, Prato } from './tipos'

export function ingredienteVazio(id: string): IngredientePrato {
  return { id, nome: '', tipo: 'un', valor: '', qtd: '', pesoBrutoKg: '', pesoLiquidoKg: '' }
}

export function pratoVazio(id: string): Prato {
  return {
    id,
    nome: '',
    calcularPerda: false,
    embalagem: '',
    margem: '',
    ingredientes: [ingredienteVazio(`${id}-i0`)],
  }
}
