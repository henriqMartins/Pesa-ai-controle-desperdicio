import { useCallback, useEffect, useId, useState } from 'react'
import { supabase } from '../lib/supabase'
import { diaDoMesSP, diasNoMesSP, inicioDoDiaSP, inicioDoMesSP } from '../lib/fuso'
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
  return inicioDoMesSP().toISOString()
}

/** Busca os registros do mês corrente com os joins de alimento e funcionário. */
async function buscarRegistrosDoMes(): Promise<RegistroCompleto[]> {
  const { data, error } = await supabase
    .from('registros')
    .select('*, alimentos(nome, unidade), funcionarios(nome)')
    .gte('criado_em', inicioDoMes())
    .order('criado_em', { ascending: false })
    .limit(5000)
  if (error) throw new Error(error.message)
  return (data as RegistroCompleto[]) ?? []
}

/**
 * Deriva todos os KPIs e rankings do Monitor a partir da lista de registros do
 * mês. Função **pura** (não lê banco nem estado) — recebe a lista e devolve os
 * números agregados. Exportada para ser testada diretamente (ver
 * `useMonitor.test.ts`). Assume que `registros` já vem filtrado ao mês corrente.
 */
export function agregar(
  registros: RegistroCompleto[],
  agora: Date = new Date(),
): Omit<DadosMonitor, 'loading'> {
  // Tudo ancorado no fuso de SP (não no relógio local do tablet) — ver lib/fuso.
  const inicioDia = inicioDoDiaSP(agora)
  const diasDecorridos = diaDoMesSP(agora)
  const diasNoMes = diasNoMesSP(agora)

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

export interface MonitorAPI extends DadosMonitor {
  /** Mensagem de erro da última carga, ou `null` se carregou bem. */
  erro: string | null
  /** Apaga um registro e recarrega os KPIs. */
  excluir: (registroId: string) => Promise<void>
  /** Recarrega os dados do mês manualmente (ex.: após editar ou em retry). */
  recarregar: () => Promise<void>
}

/** Carrega os registros do mês corrente e deriva os KPIs do Monitor ao vivo. */
export function useMonitor(): MonitorAPI {
  const [dados, setDados] = useState<DadosMonitor>(VAZIO)
  const [erro, setErro] = useState<string | null>(null)
  // Nome de canal único por instância: evita colisão de tópico quando dois
  // consumidores (ex.: Monitor + Modo de exibição) montam o hook ao mesmo tempo.
  const id = useId()

  const carregar = useCallback(async () => {
    try {
      const lista = await buscarRegistrosDoMes()
      setErro(null)
      setDados({ loading: false, ...agregar(lista) })
    } catch (e) {
      // Mantém os dados já exibidos (se houver) e marca o erro para o retry.
      setErro(e instanceof Error ? e.message : 'Falha ao carregar os dados.')
      setDados((d) => ({ ...d, loading: false }))
    }
  }, [])

  useEffect(() => {
    let ativo = true
    // Carga inicial: setState após o await (fora do corpo síncrono do efeito).
    void (async () => {
      try {
        const lista = await buscarRegistrosDoMes()
        if (!ativo) return
        setErro(null)
        setDados({ loading: false, ...agregar(lista) })
      } catch (e) {
        if (!ativo) return
        setErro(e instanceof Error ? e.message : 'Falha ao carregar os dados.')
        setDados((d) => ({ ...d, loading: false }))
      }
    })()

    // '*' cobre INSERT/UPDATE/DELETE: inserir, editar ou excluir em qualquer
    // aparelho/aba reflete ao vivo no Monitor.
    const channel = supabase
      .channel(`monitor-realtime-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registros' }, () =>
        carregar(),
      )
      .subscribe()

    return () => {
      ativo = false
      supabase.removeChannel(channel)
    }
  }, [id, carregar])

  const excluir = useCallback(
    async (registroId: string) => {
      const { error } = await supabase.from('registros').delete().eq('id', registroId)
      if (error) throw new Error(error.message)
      await carregar()
    },
    [carregar],
  )

  return { ...dados, erro, excluir, recarregar: carregar }
}
