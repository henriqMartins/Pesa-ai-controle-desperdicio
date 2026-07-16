// §4 — Ficha criar/editar. Mantém o estado do formulário (estrutural) e o
// layout dos blocos 1–4 + rodapé. Cálculos vêm do stub (a lógica canônica é do
// outro agente). Salvar/cancelar são handlers recebidos por props.
import { useState } from 'react'
import BadgeGestor from './BadgeGestor'
import LinhaIngrediente from './LinhaIngrediente'
import ResultadoPrato from './ResultadoPrato'
import { ingredienteVazio } from './dadosExemplo'
import { calcularPrato } from './calculo.stub'
import type { IngredientePrato, Prato } from './tipos'

type Props = {
  pratoInicial: Prato
  onCancelar: () => void
  onSalvar: (prato: Prato) => void
}

function IconVoltar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  )
}
function IconPrato() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 3v7a3 3 0 0 0 6 0V3" /><path d="M7 10v11" />
      <path d="M17 3c-1.7 0-3 2-3 5s1 4 3 4 3-1 3-4-1.3-5-3-5z" /><path d="M17 12v9" />
    </svg>
  )
}

const LABEL = 'block text-[11px] font-bold uppercase tracking-wider text-white/50'

export default function FichaPrato({ pratoInicial, onCancelar, onSalvar }: Props) {
  const [prato, setPrato] = useState<Prato>(pratoInicial)
  const r = calcularPrato(prato)
  const podeSalvar = prato.nome.trim().length > 0

  const set = (patch: Partial<Prato>) => setPrato((p) => ({ ...p, ...patch }))
  const setIng = (id: string, patch: Partial<IngredientePrato>) =>
    setPrato((p) => ({ ...p, ingredientes: p.ingredientes.map((i) => (i.id === id ? { ...i, ...patch } : i)) }))
  const addIng = () =>
    setPrato((p) => ({ ...p, ingredientes: [...p.ingredientes, ingredienteVazio(`i${p.ingredientes.length}-${Date.now().toString(36)}`)] }))
  const delIng = (id: string) =>
    setPrato((p) => ({ ...p, ingredientes: p.ingredientes.filter((i) => i.id !== id) }))

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button" onClick={onCancelar} aria-label="Voltar sem salvar"
          className="flex h-9 w-9 flex-none items-center justify-center rounded-lg"
          style={{ border: '1px solid var(--bd-10)', color: 'var(--tx-65)' }}
        >
          <IconVoltar />
        </button>
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl" style={{ background: 'var(--accent-grad)', boxShadow: '0 6px 18px rgba(240,70,78,.38)' }}>
          <IconPrato />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xl font-extrabold text-white">Ficha Técnica / Precificação</div>
          <div className="text-xs text-white/45">pratos prontos</div>
        </div>
        <BadgeGestor />
      </div>

      {/* Bloco 1 — Nome */}
      <div className="panel rounded-2xl p-5">
        <label className={`${LABEL} mb-2`}>Nome do prato</label>
        <input
          className="field" style={{ fontSize: 16, fontWeight: 700 }} autoFocus
          placeholder="ex: Costela com Requeijão"
          value={prato.nome} onChange={(e) => set({ nome: e.target.value })}
        />
      </div>

      {/* Bloco 2 — Ingredientes */}
      <div className="panel rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-[15px] font-extrabold text-white">Ingredientes</h3>
          <button
            type="button" role="switch" aria-checked={prato.calcularPerda}
            onClick={() => set({ calcularPerda: !prato.calcularPerda })}
            className="flex items-center gap-2"
          >
            <span className="text-xs font-bold text-white/70">Calcular perda</span>
            <span className="relative h-6 w-11 rounded-full transition-colors" style={{ background: prato.calcularPerda ? 'var(--accent-grad)' : 'var(--w-15)' }}>
              <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all" style={{ left: prato.calcularPerda ? '22px' : '2px' }} />
            </span>
          </button>
        </div>

        {/* Cabeçalho da grade (desktop) */}
        <div className="mb-2 hidden gap-2 px-1 text-[10px] font-bold uppercase tracking-[.1em] text-white/40 sm:grid" style={{ gridTemplateColumns: '1.6fr 1fr .8fr .7fr 1.1fr auto' }}>
          <span>Ingrediente</span><span>Tipo</span><span>Valor</span><span>Qtd</span><span>Custo</span><span />
        </div>

        <div className="space-y-2">
          {prato.ingredientes.map((ing) => (
            <LinhaIngrediente
              key={ing.id}
              ing={ing}
              calcularPerda={prato.calcularPerda}
              onChange={(patch) => setIng(ing.id, patch)}
              onRemover={() => delIng(ing.id)}
            />
          ))}
        </div>

        <button
          type="button" onClick={addIng}
          className="mt-3 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold"
          style={{ border: '1px solid var(--bd-15)', color: 'var(--tx-72)' }}
        >
          ＋ Adicionar ingrediente
        </button>
      </div>

      {/* Bloco 3 — Embalagem e margem */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="panel rounded-2xl p-5">
          <label className={`${LABEL} mb-2`}>Embalagem (R$)</label>
          <input className="field" inputMode="decimal" placeholder="0,00" value={prato.embalagem} onChange={(e) => set({ embalagem: e.target.value.replace(/[^0-9.,]/g, '') })} style={{ fontSize: 15, fontWeight: 700 }} />
        </div>
        <div className="panel rounded-2xl p-5">
          <label className={`${LABEL} mb-2`}>Margem sobre o custo (%)</label>
          <input className="field" inputMode="decimal" placeholder="0" value={prato.margem} onChange={(e) => set({ margem: e.target.value.replace(/[^0-9.,]/g, '') })} style={{ fontSize: 15, fontWeight: 700 }} />
        </div>
      </div>

      {/* Bloco 4 — Resultado */}
      <ResultadoPrato r={r} />

      {/* Rodapé */}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancelar} className="rounded-xl px-5 py-3 text-sm font-bold text-white/60" style={{ border: '1px solid var(--bd-15)' }}>
          Cancelar
        </button>
        <button type="button" onClick={() => onSalvar(prato)} disabled={!podeSalvar} className="btn-accent flex-1 rounded-xl py-3 text-sm font-extrabold">
          Salvar prato
        </button>
      </div>
    </div>
  )
}
