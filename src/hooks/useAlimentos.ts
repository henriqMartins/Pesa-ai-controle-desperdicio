import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Alimento, NovoAlimento } from '../types'

export function useAlimentos(apenasAtivos = true) {
  const [alimentos, setAlimentos] = useState<Alimento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function carregar() {
    setLoading(true)
    let query = supabase.from('alimentos').select('*').order('nome')
    if (apenasAtivos) query = query.eq('ativo', true)

    const { data, error: err } = await query
    if (err) setError(err.message)
    else setAlimentos(data ?? [])
    setLoading(false)
  }

  async function adicionar(novo: NovoAlimento) {
    const { error: err } = await supabase.from('alimentos').insert(novo)
    if (err) throw new Error(err.message)
    await carregar()
  }

  async function atualizar(id: string, dados: Partial<Alimento>) {
    const { error: err } = await supabase.from('alimentos').update(dados).eq('id', id)
    if (err) throw new Error(err.message)
    await carregar()
  }

  // Carga inicial (e quando o filtro muda). Como o fetch é assíncrono, os
  // setState ocorrem após o await — fora do corpo síncrono do efeito.
  useEffect(() => {
    let ativo = true
    void (async () => {
      let query = supabase.from('alimentos').select('*').order('nome')
      if (apenasAtivos) query = query.eq('ativo', true)
      const { data, error: err } = await query
      if (!ativo) return
      if (err) setError(err.message)
      else setAlimentos(data ?? [])
      setLoading(false)
    })()
    return () => {
      ativo = false
    }
  }, [apenasAtivos])

  return { alimentos, loading, error, adicionar, atualizar, recarregar: carregar }
}
