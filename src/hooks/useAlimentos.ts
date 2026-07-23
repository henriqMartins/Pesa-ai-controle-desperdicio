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

  async function excluir(id: string) {
    const { error: err } = await supabase.from('alimentos').delete().eq('id', id)
    if (err) {
      // 23503 = foreign_key_violation: há registros apontando para este produto.
      // Não apagamos (destruiria o histórico dos relatórios) — orientamos a desativar.
      if (err.code === '23503') {
        throw new Error('Este produto tem lançamentos vinculados. Desative-o em vez de excluir.')
      }
      throw new Error(err.message)
    }
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

  return { alimentos, loading, error, adicionar, atualizar, excluir, recarregar: carregar }
}
