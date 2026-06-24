import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { UnidadeBase } from '../lib/unidades'
import type { RegistroCompleto } from '../types'

export interface ItemAlimento {
  nome: string
  total: number
  quantidadeTotal: number
  unidade: UnidadeBase
  quantidade: number
}

export interface ItemFuncionario {
  nome: string
  total: number
  quantidade: number
}

export interface DadosFiltro {
  registros: RegistroCompleto[]
  total: number
  topAlimentos: ItemAlimento[]
  ranking: ItemFuncionario[]
  loading: boolean
}

function agregar(registros: RegistroCompleto[]) {
  const alimentos = new Map<string, ItemAlimento>()
  const funcionarios = new Map<string, ItemFuncionario>()
  let total = 0

  for (const r of registros) {
    const custo = Number(r.custo)
    const quant = Number(r.quantidade)
    total += custo

    const nomeA = r.alimentos.nome
    const a = alimentos.get(nomeA) ?? {
      nome: nomeA,
      total: 0,
      quantidadeTotal: 0,
      unidade: r.alimentos.unidade,
      quantidade: 0,
    }
    a.total = +(a.total + custo).toFixed(2)
    a.quantidadeTotal = +(a.quantidadeTotal + quant).toFixed(4)
    a.quantidade += 1
    alimentos.set(nomeA, a)

    const nomeF = r.funcionarios.nome
    const f = funcionarios.get(nomeF) ?? { nome: nomeF, total: 0, quantidade: 0 }
    f.total = +(f.total + custo).toFixed(2)
    f.quantidade += 1
    funcionarios.set(nomeF, f)
  }

  return {
    total: +total.toFixed(2),
    topAlimentos: [...alimentos.values()].sort((a, b) => b.total - a.total),
    ranking: [...funcionarios.values()].sort((a, b) => b.total - a.total),
  }
}

export function useRegistrosFiltro(de: string, ate: string): DadosFiltro {
  const [registros, setRegistros] = useState<RegistroCompleto[]>([])
  const [agg, setAgg] = useState<{
    total: number
    topAlimentos: ItemAlimento[]
    ranking: ItemFuncionario[]
  }>({ total: 0, topAlimentos: [], ranking: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      setLoading(true)
      const { data } = await supabase
        .from('registros')
        .select('*, alimentos(nome, unidade), funcionarios(nome)')
        .gte('criado_em', de)
        .lte('criado_em', ate)
        .order('criado_em', { ascending: false })
        .limit(5000)

      if (!cancelado) {
        const lista = (data as RegistroCompleto[]) ?? []
        setRegistros(lista)
        setAgg(agregar(lista))
        setLoading(false)
      }
    }

    carregar()

    const channel = supabase
      .channel(`painel-filtro-${de.slice(0, 10)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'registros' }, () =>
        carregar(),
      )
      .subscribe()

    return () => {
      cancelado = true
      supabase.removeChannel(channel)
    }
  }, [de, ate])

  return { registros, ...agg, loading }
}
