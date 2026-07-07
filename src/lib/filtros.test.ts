import { describe, it, expect } from 'vitest'
import {
  filtrarPeriodoPainel,
  fxRange,
  noIntervalo,
  porProduto,
  produtosDistintos,
  topRegistrados,
  topValor,
} from './filtros'
import { diaEmSP, inicioDoDiaSP } from './fuso'
import type { RegistroCompleto } from '../types'

// Toda a lógica de filtro é pura — testamos direto, sem banco. As datas são
// ancoradas no fuso de SP (ver lib/fuso), então os cenários usam `criado_em`
// explícito quando o dia importa.

const DIA = 86_400_000

/** Cria um registro de teste; sobrescreva o que importar em cada caso. */
function reg(over: {
  custo: number
  alimento: string
  quando?: Date
  funcionario?: string
}): RegistroCompleto {
  const quando = over.quando ?? new Date()
  return {
    id: Math.random().toString(36).slice(2),
    alimento_id: 'a',
    funcionario_id: 'f',
    quantidade: 1,
    unidade_registro: 'kg',
    preco_unitario_no_momento: over.custo,
    custo: over.custo,
    motivo: null,
    criado_em: quando.toISOString(),
    alimentos: { nome: over.alimento, unidade: 'kg' },
    funcionarios: { nome: over.funcionario ?? 'Maria' },
  } as RegistroCompleto
}

describe('fxRange', () => {
  const agora = new Date('2026-07-03T12:00:00-03:00')

  it('7 dias e 30 dias contam a partir de agora', () => {
    const now = agora.getTime()
    expect(fxRange('7d', undefined, undefined, agora)).toEqual([now - 7 * DIA, now])
    expect(fxRange('30d', undefined, undefined, agora)).toEqual([now - 30 * DIA, now])
  })

  it('total abrange desde a origem', () => {
    const [ini] = fxRange('total', undefined, undefined, agora)
    expect(ini).toBe(0)
  })

  it('range usa início inclusivo e fim exclusivo (dia seguinte)', () => {
    const [ini, fim] = fxRange('range', '2026-06-01', '2026-06-30', agora)
    expect(new Date(ini).toISOString()).toBe(new Date('2026-06-01T00:00:00-03:00').toISOString())
    // fim = meia-noite de 01/07 → cobre o dia 30 inteiro
    expect(new Date(fim).toISOString()).toBe(new Date('2026-07-01T00:00:00-03:00').toISOString())
  })
})

describe('noIntervalo', () => {
  it('mantém só o que está em [a, b)', () => {
    const base = [
      reg({ custo: 1, alimento: 'A', quando: new Date('2026-06-10T12:00:00-03:00') }),
      reg({ custo: 2, alimento: 'B', quando: new Date('2026-07-02T12:00:00-03:00') }),
    ]
    const range = fxRange('range', '2026-07-01', '2026-07-31', new Date('2026-07-03T12:00:00-03:00'))
    const dentro = noIntervalo(base, range)
    expect(dentro.map((r) => r.alimentos.nome)).toEqual(['B'])
  })
})

describe('topRegistrados', () => {
  it('ranqueia por ocorrências e soma o valor total', () => {
    const linhas = topRegistrados([
      reg({ custo: 10, alimento: 'Pão' }),
      reg({ custo: 5, alimento: 'Pão' }),
      reg({ custo: 30, alimento: 'X-Bacon' }),
    ])
    expect(linhas.map((l) => l.nome)).toEqual(['Pão', 'X-Bacon'])
    expect(linhas[0]).toMatchObject({ registros: 2, total: 15 })
  })

  it('desempata por valor total quando a contagem é igual', () => {
    const linhas = topRegistrados([
      reg({ custo: 5, alimento: 'Barato' }),
      reg({ custo: 50, alimento: 'Caro' }),
    ])
    expect(linhas[0].nome).toBe('Caro')
  })
})

describe('topValor', () => {
  it('ordena os registros individuais pelo custo desc', () => {
    const ordenado = topValor([
      reg({ custo: 8, alimento: 'A' }),
      reg({ custo: 32, alimento: 'B' }),
      reg({ custo: 16, alimento: 'C' }),
    ])
    expect(ordenado.map((r) => Number(r.custo))).toEqual([32, 16, 8])
  })
})

describe('porProduto', () => {
  it('lista só o produto, do mais recente ao mais antigo, e soma', () => {
    const resumo = porProduto(
      [
        reg({ custo: 10, alimento: 'Pão', quando: new Date('2026-06-30T10:00:00-03:00') }),
        reg({ custo: 20, alimento: 'Pão', quando: new Date('2026-07-01T10:00:00-03:00') }),
        reg({ custo: 99, alimento: 'Outro' }),
      ],
      'Pão',
    )
    expect(resumo.ocorrencias).toBe(2)
    expect(resumo.total).toBe(30)
    expect(new Date(resumo.registros[0].criado_em) > new Date(resumo.registros[1].criado_em)).toBe(true)
  })
})

describe('produtosDistintos', () => {
  it('devolve nomes únicos em ordem alfabética', () => {
    const nomes = produtosDistintos([
      reg({ custo: 1, alimento: 'Pão' }),
      reg({ custo: 1, alimento: 'Batata' }),
      reg({ custo: 1, alimento: 'Pão' }),
    ])
    expect(nomes).toEqual(['Batata', 'Pão'])
  })
})

describe('filtrarPeriodoPainel', () => {
  const agora = new Date('2026-07-03T12:00:00-03:00')
  const inicioOntem = new Date(inicioDoDiaSP(agora).getTime() - DIA)

  const base = [
    reg({ custo: 1, alimento: 'Hoje', quando: agora }),
    reg({ custo: 2, alimento: 'Ontem', quando: inicioOntem }),
    reg({ custo: 3, alimento: 'MesPassado', quando: new Date('2026-06-15T12:00:00-03:00') }),
  ]

  it('hoje mantém só os registros de hoje', () => {
    const r = filtrarPeriodoPainel(base, 'hoje', undefined, agora)
    expect(r.map((x) => x.alimentos.nome)).toEqual(['Hoje'])
  })

  it('ontem mantém só os de ontem', () => {
    const r = filtrarPeriodoPainel(base, 'ontem', undefined, agora)
    expect(r.map((x) => x.alimentos.nome)).toEqual(['Ontem'])
  })

  it('mês mantém do início do mês em diante', () => {
    const r = filtrarPeriodoPainel(base, 'mes', undefined, agora)
    expect(r.map((x) => x.alimentos.nome).sort()).toEqual(['Hoje', 'Ontem'])
  })

  it('total mantém tudo', () => {
    expect(filtrarPeriodoPainel(base, 'total', undefined, agora)).toHaveLength(3)
  })

  it('outra filtra pela data escolhida', () => {
    const dia = diaEmSP(new Date('2026-06-15T12:00:00-03:00'))
    const r = filtrarPeriodoPainel(base, 'outra', dia, agora)
    expect(r.map((x) => x.alimentos.nome)).toEqual(['MesPassado'])
  })
})
