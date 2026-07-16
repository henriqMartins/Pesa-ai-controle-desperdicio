import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Prato } from '../types'
import type { Prato as PratoVM } from '../components/pratos/tipos'
import { pratoParaVM, vmParaPayload } from '../lib/mapPrato'

// Traz o prato com seus ingredientes (join) já ordenados e mapeados p/ view-model.
const SELECT = '*, prato_ingredientes(*)'

/**
 * CRUD de pratos (ficha técnica / precificação). Devolve os pratos já no formato
 * de view-model que a tela consome. Segue o padrão de useAlimentos/useFuncionarios.
 *
 * `salvar` cobre criar e editar via a função RPC `salvar_prato` (transacional:
 * grava o prato e substitui a lista de ingredientes numa só transação).
 */
export function usePratos() {
  const [pratos, setPratos] = useState<PratoVM[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function carregar() {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('pratos')
      .select(SELECT)
      .eq('ativo', true)
      .order('criado_em')
    if (err) setError(err.message)
    else setPratos(((data ?? []) as Prato[]).map(pratoParaVM))
    setLoading(false)
  }

  async function salvar(vm: PratoVM) {
    // Prato já persistido tem uuid presente na lista carregada; senão é novo.
    const existe = pratos.some((p) => p.id === vm.id)
    const payload = vmParaPayload(vm, existe ? vm.id : null)
    const { error: err } = await supabase.rpc('salvar_prato', { payload })
    if (err) throw new Error(err.message)
    await carregar()
  }

  async function excluir(id: string) {
    // FK on delete cascade remove os ingredientes junto.
    const { error: err } = await supabase.from('pratos').delete().eq('id', id)
    if (err) throw new Error(err.message)
    await carregar()
  }

  useEffect(() => {
    let ativo = true
    void (async () => {
      const { data, error: err } = await supabase
        .from('pratos')
        .select(SELECT)
        .eq('ativo', true)
        .order('criado_em')
      if (!ativo) return
      if (err) setError(err.message)
      else setPratos(((data ?? []) as Prato[]).map(pratoParaVM))
      setLoading(false)
    })()
    return () => {
      ativo = false
    }
  }, [])

  return { pratos, loading, error, salvar, excluir, recarregar: carregar }
}
