import { describe, it, expect } from 'vitest'
import { numParaCampo, campoParaNumeroOuNull, pratoParaVM, vmParaPayload } from './mapPrato'
import type { Prato } from '../types'
import type { Prato as PratoVM } from '../components/pratos/tipos'

describe('numParaCampo', () => {
  it('inteiro sem casas; decimal com vírgula; 0/null → vazio', () => {
    expect(numParaCampo(38)).toBe('38')
    expect(numParaCampo(0.04)).toBe('0,04')
    expect(numParaCampo(1.2)).toBe('1,2')
    expect(numParaCampo(0)).toBe('')
    expect(numParaCampo(null)).toBe('')
  })
})

describe('campoParaNumeroOuNull', () => {
  it('vazio → null; preenchido → número', () => {
    expect(campoParaNumeroOuNull('')).toBeNull()
    expect(campoParaNumeroOuNull('  ')).toBeNull()
    expect(campoParaNumeroOuNull('0,9')).toBe(0.9)
  })
})

describe('pratoParaVM', () => {
  it('mapeia campos, ordena ingredientes por posição e converte números', () => {
    const db: Prato = {
      id: 'p1',
      nome: 'Costela',
      calcular_perda: true,
      embalagem: 2,
      margem_pct: 150,
      ativo: true,
      criado_em: '2026-01-01T00:00:00Z',
      prato_ingredientes: [
        { id: 'i2', prato_id: 'p1', posicao: 1, nome: 'Requeijão', tipo: 'g', valor: 0.04, qtd: 80, peso_bruto_kg: null, peso_liquido_kg: null },
        { id: 'i1', prato_id: 'p1', posicao: 0, nome: 'Costela', tipo: 'kg', valor: 38, qtd: 300, peso_bruto_kg: 1.2, peso_liquido_kg: 0.9 },
      ],
    }
    const vm = pratoParaVM(db)
    expect(vm.nome).toBe('Costela')
    expect(vm.calcularPerda).toBe(true)
    expect(vm.embalagem).toBe('2')
    expect(vm.margem).toBe('150')
    expect(vm.ingredientes.map((i) => i.id)).toEqual(['i1', 'i2']) // ordenado por posição
    expect(vm.ingredientes[0].valor).toBe('38')
    expect(vm.ingredientes[0].pesoBrutoKg).toBe('1,2')
    expect(vm.ingredientes[1].pesoBrutoKg).toBe('') // null → vazio
  })

  it('lida com prato sem ingredientes', () => {
    const db: Prato = {
      id: 'p2', nome: 'Vazio', calcular_perda: false, embalagem: 0, margem_pct: 0,
      ativo: true, criado_em: '2026-01-01T00:00:00Z',
    }
    expect(pratoParaVM(db).ingredientes).toEqual([])
  })
})

describe('vmParaPayload', () => {
  const vm: PratoVM = {
    id: 'temp-abc',
    nome: '  Costela  ',
    calcularPerda: true,
    embalagem: '2,00',
    margem: '150',
    ingredientes: [
      { id: 'i1', nome: 'Costela', tipo: 'kg', valor: '38', qtd: '300', pesoBrutoKg: '1,2', pesoLiquidoKg: '0,9' },
      { id: 'i2', nome: 'Requeijão', tipo: 'g', valor: '0,04', qtd: '80', pesoBrutoKg: '', pesoLiquidoKg: '' },
    ],
  }

  it('novo prato: id null e números convertidos', () => {
    const p = vmParaPayload(vm, null)
    expect(p.id).toBeNull()
    expect(p.nome).toBe('Costela') // trim
    expect(p.embalagem).toBe(2)
    expect(p.margem_pct).toBe(150)
    expect(p.ingredientes).toHaveLength(2)
    expect(p.ingredientes[0]).toMatchObject({ posicao: 0, tipo: 'kg', valor: 38, qtd: 300, peso_bruto_kg: 1.2, peso_liquido_kg: 0.9 })
    expect(p.ingredientes[1]).toMatchObject({ posicao: 1, peso_bruto_kg: null, peso_liquido_kg: null })
  })

  it('edição: preserva o uuid recebido', () => {
    expect(vmParaPayload(vm, 'uuid-real').id).toBe('uuid-real')
  })

  it('ida e volta (banco → VM → payload) preserva os valores', () => {
    const db: Prato = {
      id: 'p1', nome: 'Costela', calcular_perda: true, embalagem: 2, margem_pct: 150,
      ativo: true, criado_em: '2026-01-01T00:00:00Z',
      prato_ingredientes: [
        { id: 'i1', prato_id: 'p1', posicao: 0, nome: 'Costela', tipo: 'kg', valor: 38, qtd: 300, peso_bruto_kg: 1.2, peso_liquido_kg: 0.9 },
      ],
    }
    const payload = vmParaPayload(pratoParaVM(db), db.id)
    expect(payload).toMatchObject({
      id: 'p1', nome: 'Costela', calcular_perda: true, embalagem: 2, margem_pct: 150,
    })
    expect(payload.ingredientes[0]).toMatchObject({ tipo: 'kg', valor: 38, qtd: 300, peso_bruto_kg: 1.2, peso_liquido_kg: 0.9 })
  })
})
