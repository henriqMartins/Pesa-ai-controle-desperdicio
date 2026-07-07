import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { RegistroCompleto } from '../types'

export interface RegistrosPeriodo {
  registros: RegistroCompleto[]
  loading: boolean
  erro: string | null
  recarregar: () => Promise<void>
}

/** Busca os registros no intervalo `[a, b)` (ms) com os joins do Monitor. */
async function buscar(a: number, b: number): Promise<RegistroCompleto[]> {
  let q = supabase
    .from('registros')
    .select('*, alimentos(nome, unidade), funcionarios(nome)')
    .lt('criado_em', new Date(b).toISOString())
    .order('criado_em', { ascending: false })
    .limit(5000)
  // a === 0 significa "desde a origem" (Total) — sem limite inferior.
  if (a > 0) q = q.gte('criado_em', new Date(a).toISOString())
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data as RegistroCompleto[]) ?? []
}

/**
 * Busca os registros num intervalo `[a, b)` em ms, sob demanda — diferente de
 * `useMonitor`, que só carrega o mês corrente. Os filtros avançados precisam de
 * períodos que ultrapassam o mês (7/30 dias, total, personalizado), então a
 * consulta é feita direto no banco pelo recorte de datas.
 *
 * Passar `null` deixa o hook ocioso (não consulta) — útil para mini-filtros que
 * só precisam de dados extras quando o usuário escolhe "Total"/"Outra data".
 *
 * O `range` deve ter identidade estável (memoize no chamador com um `agora`
 * fixo); a consulta refaz sempre que `a`/`b` mudam.
 */
export function useRegistrosPeriodo(range: [number, number] | null): RegistrosPeriodo {
  const [registros, setRegistros] = useState<RegistroCompleto[]>([])
  const [loading, setLoading] = useState(range !== null)
  const [erro, setErro] = useState<string | null>(null)

  const a = range?.[0] ?? null
  const b = range?.[1] ?? null
  const ocioso = a === null || b === null

  const carregar = useCallback(async () => {
    if (a === null || b === null) return
    setLoading(true)
    try {
      const lista = await buscar(a, b)
      setErro(null)
      setRegistros(lista)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao carregar os dados.')
    } finally {
      setLoading(false)
    }
  }, [a, b])

  useEffect(() => {
    if (a === null || b === null) return
    let ativo = true
    // setState só após o await (dentro da IIFE) — evita render em cascata.
    void (async () => {
      setLoading(true)
      try {
        const lista = await buscar(a, b)
        if (!ativo) return
        setErro(null)
        setRegistros(lista)
      } catch (e) {
        if (!ativo) return
        setErro(e instanceof Error ? e.message : 'Falha ao carregar os dados.')
      } finally {
        if (ativo) setLoading(false)
      }
    })()
    return () => {
      ativo = false
    }
  }, [a, b])

  // Ocioso (sem range) → nada a exibir, sem tocar em estado dentro do efeito.
  return {
    registros: ocioso ? [] : registros,
    loading: ocioso ? false : loading,
    erro: ocioso ? null : erro,
    recarregar: carregar,
  }
}
