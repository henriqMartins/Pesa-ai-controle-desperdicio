import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Motivo, NovoMotivo } from '../types'

export function useMotivos(apenasAtivos = true) {
  const [motivos, setMotivos] = useState<Motivo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function carregar() {
    setLoading(true)
    let query = supabase.from('motivos').select('*').order('criado_em')
    if (apenasAtivos) query = query.eq('ativo', true)

    const { data, error: err } = await query
    if (err) setError(err.message)
    else setMotivos(data ?? [])
    setLoading(false)
  }

  async function adicionar(novo: NovoMotivo) {
    const { error: err } = await supabase.from('motivos').insert(novo)
    if (err) throw new Error(err.message)
    await carregar()
  }

  async function atualizar(id: string, dados: Partial<Motivo>) {
    const { error: err } = await supabase.from('motivos').update(dados).eq('id', id)
    if (err) throw new Error(err.message)
    await carregar()
  }

  async function excluir(id: string) {
    const { error: err } = await supabase.from('motivos').delete().eq('id', id)
    if (err) throw new Error(err.message)
    await carregar()
  }

  // Carga inicial (e quando o filtro muda). Como o fetch é assíncrono, os
  // setState ocorrem após o await — fora do corpo síncrono do efeito.
  useEffect(() => {
    let ativo = true
    void (async () => {
      let query = supabase.from('motivos').select('*').order('criado_em')
      if (apenasAtivos) query = query.eq('ativo', true)
      const { data, error: err } = await query
      if (!ativo) return
      if (err) setError(err.message)
      else setMotivos(data ?? [])
      setLoading(false)
    })()
    return () => {
      ativo = false
    }
  }, [apenasAtivos])

  return { motivos, loading, error, adicionar, atualizar, excluir, recarregar: carregar }
}
