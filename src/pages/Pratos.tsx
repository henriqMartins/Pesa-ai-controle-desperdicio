// Aba Pratos — container que alterna lista ↔ ficha (view-switch local, §2).
// Os dados vêm do Supabase via usePratos; o cálculo dos resumos usa a lógica
// canônica de src/lib/calculoPrato. Ver docs/plano-tela-pratos-logica.md.
import { useMemo, useState } from 'react'
import ListaPratos from '../components/pratos/ListaPratos'
import FichaPrato from '../components/pratos/FichaPrato'
import { calcularPrato } from '../lib/calculoPrato'
import { pratoVazio } from '../components/pratos/fabricas'
import { usePratos } from '../hooks/usePratos'
import type { Prato, PratoResumo } from '../components/pratos/tipos'

type Vista = { tela: 'lista' } | { tela: 'ficha'; prato: Prato }

export default function Pratos() {
  const { pratos, loading, salvar, excluir } = usePratos()
  const [vista, setVista] = useState<Vista>({ tela: 'lista' })

  const resumos: PratoResumo[] = useMemo(
    () =>
      pratos.map((p) => {
        const r = calcularPrato(p)
        return { id: p.id, nome: p.nome, custo: r.totalCusto, markup: r.markup, precoVenda: r.precoSugerido }
      }),
    [pratos],
  )

  function novo() {
    setVista({ tela: 'ficha', prato: pratoVazio(`pr${Date.now().toString(36)}`) })
  }
  function editar(id: string) {
    const p = pratos.find((x) => x.id === id)
    if (p) setVista({ tela: 'ficha', prato: p })
  }
  async function aoExcluir(id: string) {
    if (!window.confirm('Excluir este prato?')) return
    try {
      await excluir(id)
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Erro ao excluir o prato.')
    }
  }
  async function aoSalvar(prato: Prato) {
    try {
      await salvar(prato)
      setVista({ tela: 'lista' })
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Erro ao salvar o prato.')
    }
  }

  if (vista.tela === 'ficha') {
    return <FichaPrato pratoInicial={vista.prato} onCancelar={() => setVista({ tela: 'lista' })} onSalvar={aoSalvar} />
  }
  return <ListaPratos pratos={resumos} loading={loading} onNovo={novo} onEditar={editar} onExcluir={aoExcluir} />
}
