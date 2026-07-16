// DADOS DE EXEMPLO (mock) — só para o preview visual da tela.
// O agente de lógica remove isto e liga a `usePratos` (Supabase).

import type { Prato } from './tipos'

let seq = 0
const uid = (p: string) => `${p}${(seq++).toString(36)}`

export function pratosExemplo(): Prato[] {
  return [
    {
      id: uid('pr'),
      nome: 'Costela com Requeijão',
      calcularPerda: true,
      embalagem: '2,00',
      margem: '150',
      ingredientes: [
        { id: uid('in'), nome: 'Costela bovina', tipo: 'kg', valor: '38,00', qtd: '300', pesoBrutoKg: '1,2', pesoLiquidoKg: '0,9' },
        { id: uid('in'), nome: 'Requeijão', tipo: 'g', valor: '0,04', qtd: '80', pesoBrutoKg: '', pesoLiquidoKg: '' },
        { id: uid('in'), nome: 'Batata palha', tipo: 'un', valor: '1,50', qtd: '1', pesoBrutoKg: '', pesoLiquidoKg: '' },
      ],
    },
    {
      id: uid('pr'),
      nome: 'Porção de Mandioca',
      calcularPerda: false,
      embalagem: '1,50',
      margem: '120',
      ingredientes: [
        { id: uid('in'), nome: 'Mandioca', tipo: 'kg', valor: '6,00', qtd: '400', pesoBrutoKg: '', pesoLiquidoKg: '' },
        { id: uid('in'), nome: 'Óleo', tipo: 'mL', valor: '0,01', qtd: '150', pesoBrutoKg: '', pesoLiquidoKg: '' },
      ],
    },
  ]
}

export function ingredienteVazio(id: string) {
  return { id, nome: '', tipo: 'un' as const, valor: '', qtd: '', pesoBrutoKg: '', pesoLiquidoKg: '' }
}

export function pratoVazio(id: string): Prato {
  return { id, nome: '', calcularPerda: false, embalagem: '', margem: '', ingredientes: [ingredienteVazio(`${id}-i0`)] }
}
