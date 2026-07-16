// Bloco 4 — card hero de resultado. Decisão §5.5: gradiente accent laranja,
// preço em branco. Componente puro: recebe o resumo já calculado.
import type { ResultadoCalculo } from './tipos'
import { brl } from '../../lib/calculoPrato'

function Linha({ rotulo, valor, forte = false }: { rotulo: string; valor: string; forte?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm text-white/90" style={forte ? { fontWeight: 800 } : { fontWeight: 600 }}>
      <span>{rotulo}</span>
      <span className="tabular-nums">{valor}</span>
    </div>
  )
}

export default function ResultadoPrato({ r }: { r: ResultadoCalculo }) {
  const divisor = { borderTop: '1px solid rgba(255,255,255,.22)' }
  return (
    <div
      className="rounded-2xl p-5 text-white"
      style={{ background: 'var(--accent-grad)', boxShadow: '0 8px 22px rgba(240,70,78,.3)' }}
    >
      <Linha rotulo="Custo dos ingredientes" valor={brl(r.custoIngredientes)} />
      <Linha rotulo="+ Embalagem" valor={brl(r.embalagem)} />
      <div style={divisor} className="my-1" />
      <Linha rotulo="Total custo" valor={brl(r.totalCusto)} forte />
      <div style={divisor} className="mb-3 mt-1" />

      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[.1em] text-white/85">
            Preço de venda sugerido
          </div>
          <div className="mt-1 text-4xl font-extrabold tabular-nums" aria-live="polite">
            {brl(r.precoSugerido)}
          </div>
        </div>
        <div className="text-right text-xs font-semibold text-white/85">
          <div>Markup: {r.markup.toFixed(2).replace('.', ',')}x</div>
          <div>Margem s/venda: {Math.round(r.margemVenda * 100)}%</div>
        </div>
      </div>
    </div>
  )
}
