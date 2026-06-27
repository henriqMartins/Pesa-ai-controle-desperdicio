import { describe, it, expect } from 'vitest'
import { agregar } from './useMonitor'
import type { RegistroCompleto } from '../types'

// `agregar` calcula todos os números do Monitor (totais do dia/mês, média,
// projeção, top alimentos, top motivos e ranking de funcionários) a partir da
// lista de registros do mês. É pura, então testamos direto, sem banco.

/** Cria um registro de teste com valores padrão; sobrescreva o que importar. */
function reg(over: Partial<RegistroCompleto> & {
  custo: number
  alimentoNome: string
  funcionarioNome: string
}): RegistroCompleto {
  const { custo, alimentoNome, funcionarioNome, ...resto } = over
  return {
    id: Math.random().toString(36).slice(2),
    alimento_id: 'a',
    funcionario_id: 'f',
    quantidade: 1,
    unidade_registro: 'kg',
    preco_unitario_no_momento: custo,
    custo,
    motivo: null,
    criado_em: new Date().toISOString(), // hoje
    alimentos: { nome: alimentoNome, unidade: 'kg' },
    funcionarios: { nome: funcionarioNome },
    ...resto,
  } as RegistroCompleto
}

describe('agregar', () => {
  it('devolve tudo zerado quando não há registros', () => {
    const d = agregar([])
    expect(d.totalMes).toBe(0)
    expect(d.totalDia).toBe(0)
    expect(d.registrosMes).toBe(0)
    expect(d.maiorDoDia).toBeNull()
    expect(d.topAlimentos).toEqual([])
    expect(d.rankingFuncionarios).toEqual([])
  })

  it('soma os totais do mês e do dia', () => {
    const d = agregar([
      reg({ custo: 10, alimentoNome: 'Frango', funcionarioNome: 'Maria' }),
      reg({ custo: 30, alimentoNome: 'Camarão', funcionarioNome: 'João' }),
      reg({ custo: 5, alimentoNome: 'Frango', funcionarioNome: 'Maria' }),
    ])
    expect(d.totalMes).toBe(45)
    expect(d.totalDia).toBe(45) // todos criados hoje
    expect(d.registrosMes).toBe(3)
    expect(d.registrosDia).toBe(3)
  })

  it('ordena o top de alimentos por valor e agrupa repetidos', () => {
    const d = agregar([
      reg({ custo: 10, alimentoNome: 'Frango', funcionarioNome: 'Maria' }),
      reg({ custo: 30, alimentoNome: 'Camarão', funcionarioNome: 'João' }),
      reg({ custo: 5, alimentoNome: 'Frango', funcionarioNome: 'Maria' }),
    ])
    expect(d.topAlimentos.map((a) => a.nome)).toEqual(['Camarão', 'Frango'])
    const frango = d.topAlimentos.find((a) => a.nome === 'Frango')!
    expect(frango.total).toBe(15) // 10 + 5
    expect(frango.registros).toBe(2)
  })

  it('monta o ranking de funcionários do maior para o menor', () => {
    const d = agregar([
      reg({ custo: 10, alimentoNome: 'Frango', funcionarioNome: 'Maria' }),
      reg({ custo: 30, alimentoNome: 'Camarão', funcionarioNome: 'João' }),
      reg({ custo: 5, alimentoNome: 'Frango', funcionarioNome: 'Maria' }),
    ])
    expect(d.rankingFuncionarios.map((f) => f.nome)).toEqual(['João', 'Maria'])
    expect(d.rankingFuncionarios[1].total).toBe(15) // Maria
  })

  it('marca o alimento de maior custo do dia', () => {
    const d = agregar([
      reg({ custo: 10, alimentoNome: 'Frango', funcionarioNome: 'Maria' }),
      reg({ custo: 30, alimentoNome: 'Camarão', funcionarioNome: 'João' }),
    ])
    expect(d.maiorDoDia).toBe('Camarão')
  })

  it('agrupa registros sem motivo sob "Sem motivo"', () => {
    const d = agregar([
      reg({ custo: 10, alimentoNome: 'Frango', funcionarioNome: 'Maria', motivo: '' }),
      reg({ custo: 20, alimentoNome: 'Camarão', funcionarioNome: 'João', motivo: 'Sobra' }),
    ])
    const semMotivo = d.topMotivos.find((m) => m.nome === 'Sem motivo')
    expect(semMotivo?.total).toBe(10)
    expect(d.topMotivos.map((m) => m.nome)).toEqual(['Sobra', 'Sem motivo'])
  })

  it('calcula a média por dia com base nos dias decorridos do mês', () => {
    const d = agregar([
      reg({ custo: 10, alimentoNome: 'Frango', funcionarioNome: 'Maria' }),
      reg({ custo: 30, alimentoNome: 'Camarão', funcionarioNome: 'João' }),
    ])
    const diasDecorridos = new Date().getDate()
    expect(d.mediaPorDia).toBeCloseTo(40 / diasDecorridos, 2)
  })
})
