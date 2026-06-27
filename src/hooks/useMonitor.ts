import { useEffect, useId, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { UnidadeBase } from '../lib/unidades'
import type { RegistroCompleto } from '../types'

export interface ItemRanking {
  nome: string
  total: number
  registros: number
}

export interface ItemAlimentoRanking extends ItemRanking {
  quantidadeTotal: number
  unidade: UnidadeBase
}

export interface DadosMonitor {
  loading: boolean
  totalDia: number
  totalMes: number
  registrosDia: number
  registrosMes: number
  mediaPorDia: number
  projecaoMes: number
  maiorDoDia: string | null
  ultimos: RegistroCompleto[]
  topAlimentos: ItemAlimentoRanking[]
  topMotivos: ItemRanking[]
  rankingFuncionarios: ItemRanking[]
  /** Registros do mês (para exportação). */
  registrosMesLista: RegistroCompleto[]
}

const VAZIO: DadosMonitor = {
  loading: true,
  totalDia: 0,
  totalMes: 0,
  registrosDia: 0,
  registrosMes: 0,
  mediaPorDia: 0,
  projecaoMes: 0,
  maiorDoDia: null,
  ultimos: [],
  topAlimentos: [],
  topMotivos: [],
  rankingFuncionarios: [],
  registrosMesLista: [],
}

function inicioDoMes(): string {
  const agora = new Date()
  return new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString()
}

/**
 * Deriva todos os KPIs e rankings do Monitor a partir da lista de registros do
 * mês. Função **pura** (não lê banco nem estado) — recebe a lista e devolve os
 * números agregados. Exportada para ser testada diretamente (ver
 * `useMonitor.test.ts`). Assume que `registros` já vem filtrado ao mês corrente.
 */
export function agregar(registros: RegistroCompleto[]): Omit<DadosMonitor, 'loading'> {
  const agora = new Date()
  const inicioDia = new Date(agora)
  inicioDia.setHours(0, 0, 0, 0)

  const diasDecorridos = agora.getDate()
  const diasNoMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).getDate()

  let totalDia = 0
  let totalMes = 0
  let registrosDia = 0

  const alimentos = new Map<string, ItemAlimentoRanking>()
  const motivos = new Map<string, ItemRanking>()
  const funcs = new Map<string, ItemRanking>()
  let maiorDoDia: { nome: string; custo: number } | null = null

  for (const r of registros) {
    const custo = Number(r.custo)
    const quant = Number(r.quantidade)
    totalMes += custo

    const ehDoDia = new Date(r.criado_em) >= inicioDia
    if (ehDoDia) {
      totalDia += custo
      registrosDia += 1
      if (!maiorDoDia || custo > maiorDoDia.custo) {
        maiorDoDia = { nome: r.alimentos.nome, custo }
      }
    }

    const nomeA = r.alimentos.nome
    const a = alimentos.get(nomeA) ?? {
      nome: nomeA,
      total: 0,
      registros: 0,
      quantidadeTotal: 0,
      unidade: r.alimentos.unidade,
    }
    a.total = +(a.total + custo).toFixed(2)
    a.quantidadeTotal = +(a.quantidadeTotal + quant).toFixed(4)
    a.registros += 1
    alimentos.set(nomeA, a)

    const textoMotivo = r.motivo?.trim() || 'Sem motivo'
    const m = motivos.get(textoMotivo) ?? { nome: textoMotivo, total: 0, registros: 0 }
    m.total = +(m.total + custo).toFixed(2)
    m.registros += 1
    motivos.set(textoMotivo, m)

    const nomeF = r.funcionarios.nome
    const fn = funcs.get(nomeF) ?? { nome: nomeF, total: 0, registros: 0 }
    fn.total = +(fn.total + custo).toFixed(2)
    fn.registros += 1
    funcs.set(nomeF, fn)
  }

  const mediaPorDia = diasDecorridos > 0 ? +(totalMes / diasDecorridos).toFixed(2) : 0
  const projecaoMes = +(mediaPorDia * diasNoMes).toFixed(2)

  return {
    totalDia: +totalDia.toFixed(2),
    totalMes: +totalMes.toFixed(2),
    registrosDia,
    registrosMes: registros.length,
    mediaPorDia,
    projecaoMes,
    maiorDoDia: maiorDoDia?.nome ?? null,
    ultimos: registros.slice(0, 8),
    topAlimentos: [...alimentos.values()].sort((a, b) => b.total - a.total).slice(0, 5),
    topMotivos: [...motivos.values()].sort((a, b) => b.total - a.total).slice(0, 5),
    rankingFuncionarios: [...funcs.values()].sort((a, b) => b.total - a.total),
    registrosMesLista: registros,
  }
}

/** Carrega os registros do mês corrente e deriva os KPIs do Monitor ao vivo. */
export function useMonitor(): DadosMonitor {
  const [dados, setDados] = useState<DadosMonitor>(VAZIO)
  // Nome de canal único por instância: evita colisão de tópico quando dois
  // consumidores (ex.: Monitor + Modo de exibição) montam o hook ao mesmo tempo.
  const id = useId()

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      const { data } = await supabase
        .from('registros')
        .select('*, alimentos(nome, unidade), funcionarios(nome)')
        .gte('criado_em', inicioDoMes())
        .order('criado_em', { ascending: false })
        .limit(5000)

      if (!cancelado) {
        const lista = (data as RegistroCompleto[]) ?? []
        setDados({ loading: false, ...agregar(lista) })
      }
    }

    carregar()

    const channel = supabase
      .channel(`monitor-realtime-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'registros' }, () =>
        carregar(),
      )
      .subscribe()

    return () => {
      cancelado = true
      supabase.removeChannel(channel)
    }
  }, [id])

  return dados
}
