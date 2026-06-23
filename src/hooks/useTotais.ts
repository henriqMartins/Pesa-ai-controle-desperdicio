import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Totais {
  hoje: number
  mes: number
}

function inicioDia() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function inicioMes() {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function somar(rows: { custo: number }[] | null) {
  return (rows ?? []).reduce((acc, r) => acc + Number(r.custo), 0)
}

export function useTotais() {
  const [totais, setTotais] = useState<Totais>({ hoje: 0, mes: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      const [{ data: dHoje }, { data: dMes }] = await Promise.all([
        supabase.from('registros').select('custo').gte('criado_em', inicioDia()),
        supabase.from('registros').select('custo').gte('criado_em', inicioMes()),
      ])

      if (!cancelado) {
        setTotais({ hoje: somar(dHoje), mes: somar(dMes) })
        setLoading(false)
      }
    }

    carregar()

    const channel = supabase
      .channel('totais-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'registros' }, () => carregar())
      .subscribe()

    return () => {
      cancelado = true
      supabase.removeChannel(channel)
    }
  }, [])

  return { totais, loading }
}
