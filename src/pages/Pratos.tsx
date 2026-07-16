// Aba Pratos — container que alterna lista ↔ ficha (view-switch local, §2).
//
// Camada VISUAL: mantém o estado de navegação e, POR ENQUANTO, os dados em
// memória (semeados com exemplos) só para o preview. O AGENTE DE LÓGICA
// substitui o bloco marcado por `usePratos` (Supabase) + cálculo canônico e
// remove `dadosExemplo`. Ver docs/plano-tela-pratos-logica.md.
import { useMemo, useState } from 'react'
import ListaPratos from '../components/pratos/ListaPratos'
import FichaPrato from '../components/pratos/FichaPrato'
import { calcularPrato } from '../components/pratos/calculo.stub'
import { pratosExemplo, pratoVazio } from '../components/pratos/dadosExemplo'
import type { Prato, PratoResumo } from '../components/pratos/tipos'

type Vista = { tela: 'lista' } | { tela: 'ficha'; prato: Prato }

export default function Pratos() {
  // ── TODO(lógica): trocar por usePratos() (Supabase). ──────────────────────
  const [pratos, setPratos] = useState<Prato[]>(() => pratosExemplo())
  // ──────────────────────────────────────────────────────────────────────────
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
  function excluir(id: string) {
    if (!window.confirm('Excluir este prato?')) return
    setPratos((ps) => ps.filter((p) => p.id !== id))
  }
  function salvar(prato: Prato) {
    setPratos((ps) => (ps.some((p) => p.id === prato.id) ? ps.map((p) => (p.id === prato.id ? prato : p)) : [...ps, prato]))
    setVista({ tela: 'lista' })
  }

  if (vista.tela === 'ficha') {
    return <FichaPrato pratoInicial={vista.prato} onCancelar={() => setVista({ tela: 'lista' })} onSalvar={salvar} />
  }
  return <ListaPratos pratos={resumos} onNovo={novo} onEditar={editar} onExcluir={excluir} />
}
