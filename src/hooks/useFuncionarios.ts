import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Funcionario, NovoFuncionario } from '../types'

export function useFuncionarios(apenasAtivos = true) {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function carregar() {
    setLoading(true)
    let query = supabase.from('funcionarios').select('*').order('nome')
    if (apenasAtivos) query = query.eq('ativo', true)

    const { data, error: err } = await query
    if (err) setError(err.message)
    else setFuncionarios(data ?? [])
    setLoading(false)
  }

  async function adicionar(novo: NovoFuncionario) {
    const { error: err } = await supabase.from('funcionarios').insert(novo)
    if (err) throw new Error(err.message)
    await carregar()
  }

  async function atualizar(id: string, dados: Partial<Funcionario>) {
    const { error: err } = await supabase.from('funcionarios').update(dados).eq('id', id)
    if (err) throw new Error(err.message)
    await carregar()
  }

  async function excluir(id: string) {
    const { error: err } = await supabase.from('funcionarios').delete().eq('id', id)
    if (err) {
      // 23503 = foreign_key_violation: há registros feitos por este funcionário.
      // Não apagamos (perderia a autoria no histórico) — orientamos a desativar.
      if (err.code === '23503') {
        throw new Error('Este funcionário tem lançamentos vinculados. Desative-o em vez de excluir.')
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
      let query = supabase.from('funcionarios').select('*').order('nome')
      if (apenasAtivos) query = query.eq('ativo', true)
      const { data, error: err } = await query
      if (!ativo) return
      if (err) setError(err.message)
      else setFuncionarios(data ?? [])
      setLoading(false)
    })()
    return () => {
      ativo = false
    }
  }, [apenasAtivos])

  return { funcionarios, loading, error, adicionar, atualizar, excluir, recarregar: carregar }
}
