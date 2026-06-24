import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { NovoRegistro, RegistroCompleto } from '../types'

export function useRegistros(limite = 20) {
  const [registros, setRegistros] = useState<RegistroCompleto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      const { data } = await supabase
        .from('registros')
        .select('*, alimentos(nome, unidade), funcionarios(nome)')
        .order('criado_em', { ascending: false })
        .limit(limite)

      if (!cancelado) {
        setRegistros((data as RegistroCompleto[]) ?? [])
        setLoading(false)
      }
    }

    carregar()

    const channel = supabase
      .channel('registros-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'registros' }, () => carregar())
      .subscribe()

    return () => {
      cancelado = true
      supabase.removeChannel(channel)
    }
  }, [limite])

  async function inserir(novo: NovoRegistro) {
    const { error } = await supabase.from('registros').insert(novo)
    if (error) throw new Error(error.message)
  }

  return { registros, loading, inserir }
}
