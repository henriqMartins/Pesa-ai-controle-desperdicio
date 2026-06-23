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

  useEffect(() => { carregar() }, [apenasAtivos]) // eslint-disable-line react-hooks/exhaustive-deps

  return { funcionarios, loading, error, adicionar, atualizar, recarregar: carregar }
}
