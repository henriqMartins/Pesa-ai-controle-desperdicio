/**
 * Lógica **pura** dos filtros do Monitor de Desperdício — não lê banco nem
 * estado. Alimenta tanto o modal de filtros avançados (3 modos) quanto os
 * mini-filtros de período dos painéis. Ancorada no fuso de SP (ver `lib/fuso`),
 * nunca no relógio local do tablet. Exportada e sem efeitos para ser testada
 * direto (ver `filtros.test.ts`), no mesmo espírito de `agregar()`.
 */
import {
  diaEmSP,
  fimDoDiaSPDeString,
  inicioDoDiaSP,
  inicioDoDiaSPDeString,
  inicioDoMesSP,
} from './fuso'
import type { RegistroCompleto } from '../types'

const DIA = 86_400_000 // ms em 24h

// ─── Modal avançado ──────────────────────────────────────────────────────────

/** Os três modos de análise do modal (doc §3). */
export type ModoFiltro = 'topProd' | 'topValor' | 'porProduto'

/** Opções do seletor de período do modal (doc §3 — fxRange). */
export type PeriodoFiltro = '7d' | '30d' | 'mes' | 'total' | 'range'

/** Linha do ranking "Mais registrados": um produto agregado no período. */
export interface LinhaProduto {
  nome: string
  registros: number
  total: number
}

/**
 * Devolve o intervalo `[início, fim]` em ms para o período escolhido. `fim` é
 * exclusivo para `range` (usa a meia-noite do dia seguinte ao "até").
 */
export function fxRange(
  periodo: PeriodoFiltro,
  de?: string,
  ate?: string,
  agora: Date = new Date(),
): [number, number] {
  const now = agora.getTime()
  if (periodo === '7d') return [now - 7 * DIA, now]
  if (periodo === '30d') return [now - 30 * DIA, now]
  if (periodo === 'mes') return [inicioDoMesSP(agora).getTime(), now]
  if (periodo === 'range') {
    const ini = de ? inicioDoDiaSPDeString(de).getTime() : 0
    const fim = ate ? fimDoDiaSPDeString(ate).getTime() : now
    return [ini, fim]
  }
  return [0, now] // 'total'
}

/** Recorta a base ao intervalo `[a, b)` uma única vez (reusado pelos 3 modos). */
export function noIntervalo(
  registros: RegistroCompleto[],
  [a, b]: [number, number],
): RegistroCompleto[] {
  return registros.filter((r) => {
    const ts = new Date(r.criado_em).getTime()
    return ts >= a && ts < b
  })
}

/**
 * Modo "Mais registrados": agrupa por produto e ranqueia pela **quantidade de
 * ocorrências** no período (desempate pelo valor total acumulado).
 */
export function topRegistrados(registros: RegistroCompleto[]): LinhaProduto[] {
  const mapa = new Map<string, LinhaProduto>()
  for (const r of registros) {
    const nome = r.alimentos.nome
    const linha = mapa.get(nome) ?? { nome, registros: 0, total: 0 }
    linha.registros += 1
    linha.total = +(linha.total + Number(r.custo)).toFixed(2)
    mapa.set(nome, linha)
  }
  return [...mapa.values()].sort((a, b) => b.registros - a.registros || b.total - a.total)
}

/**
 * Modo "Maior valor": ordena os lançamentos individuais pelo **valor de cada
 * registro** (desc). O primeiro item é o card-herói na UI.
 */
export function topValor(registros: RegistroCompleto[]): RegistroCompleto[] {
  return [...registros].sort((a, b) => Number(b.custo) - Number(a.custo))
}

/** Rodapé do modo "Por produto": ocorrências e valor total de um produto. */
export interface ResumoProduto {
  registros: RegistroCompleto[]
  ocorrencias: number
  total: number
}

/**
 * Modo "Por produto": todas as datas em que um produto foi registrado no
 * período (mais recentes primeiro), com a soma de ocorrências e valor.
 */
export function porProduto(registros: RegistroCompleto[], produto: string): ResumoProduto {
  const filtrados = registros
    .filter((r) => r.alimentos.nome === produto)
    .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
  const total = filtrados.reduce((s, r) => s + Number(r.custo), 0)
  return { registros: filtrados, ocorrencias: filtrados.length, total: +total.toFixed(2) }
}

/** Nomes de produtos distintos presentes na base (ordem alfabética) — p/ o select. */
export function produtosDistintos(registros: RegistroCompleto[]): string[] {
  return [...new Set(registros.map((r) => r.alimentos.nome))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  )
}

// ─── Mini-filtros de painel (doc §2) ───────────────────────────────────────────

/** Períodos dos chips rápidos de cada painel. */
export type PeriodoPainel = 'hoje' | 'ontem' | 'mes' | 'total' | 'outra'

/**
 * Filtra uma lista de registros pelo período de um mini-filtro de painel.
 * `outra` compara com a data 'AAAA-MM-DD' escolhida no calendário.
 */
export function filtrarPeriodoPainel(
  registros: RegistroCompleto[],
  periodo: PeriodoPainel,
  data?: string,
  agora: Date = new Date(),
): RegistroCompleto[] {
  if (periodo === 'total') return registros
  if (periodo === 'mes') {
    const ini = inicioDoMesSP(agora).getTime()
    return registros.filter((r) => new Date(r.criado_em).getTime() >= ini)
  }
  if (periodo === 'outra') {
    if (!data) return registros
    return registros.filter((r) => diaEmSP(new Date(r.criado_em)) === data)
  }
  // 'hoje' / 'ontem' comparam a chave de dia no fuso de SP.
  const hoje = diaEmSP(agora)
  // Ontem em SP: 1ms antes da meia-noite de hoje (robusto à virada de mês).
  const ontem = diaEmSP(new Date(inicioDoDiaSP(agora).getTime() - 1))
  const alvo = periodo === 'hoje' ? hoje : ontem
  return registros.filter((r) => diaEmSP(new Date(r.criado_em)) === alvo)
}
