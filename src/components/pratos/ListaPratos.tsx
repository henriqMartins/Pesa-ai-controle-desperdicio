// §3 — lista de pratos. Presentational: recebe os resumos e os handlers.
import BadgeGestor from './BadgeGestor'
import { brl } from './calculo.stub'
import type { PratoResumo } from './tipos'

type Props = {
  pratos: PratoResumo[]
  loading?: boolean
  onNovo: () => void
  onEditar: (id: string) => void
  onExcluir: (id: string) => void
}

function IconLapis() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  )
}
function IconLixeira() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function BotaoAcao({ onClick, label, hover, children }: { onClick: () => void; label: string; hover: string; children: React.ReactNode }) {
  return (
    <button
      type="button" aria-label={label} title={label}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-white/30 transition-colors"
      style={{ border: '1px solid var(--bd-08)' }}
      onMouseEnter={(e) => (e.currentTarget.style.color = hover)}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--tx-30)')}
    >
      {children}
    </button>
  )
}

export default function ListaPratos({ pratos, loading, onNovo, onEditar, onExcluir }: Props) {
  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[26px] font-extrabold tracking-tight text-white">Pratos prontos</h1>
          <p className="mt-0.5 text-[13px] font-medium text-white/50">
            {pratos.length} prato{pratos.length === 1 ? '' : 's'} cadastrado{pratos.length === 1 ? '' : 's'} · ficha técnica e precificação
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BadgeGestor />
          <button onClick={onNovo} className="btn-accent flex h-10 items-center rounded-xl px-4 text-sm font-extrabold">
            ＋ Novo prato
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl" style={{ background: 'var(--surface)' }} />)}
        </div>
      ) : pratos.length === 0 ? (
        /* Estado vazio */
        <div className="panel rounded-2xl p-8 text-center">
          <p className="text-sm text-white/40">Nenhum prato cadastrado ainda.</p>
          <button onClick={onNovo} className="mt-4 rounded-xl px-4 py-2.5 text-sm font-bold" style={{ border: '1px solid var(--bd-15)', color: 'var(--tx-72)' }}>
            ＋ Novo prato
          </button>
        </div>
      ) : (
        /* Lista */
        <div className="flex flex-col gap-2">
          {pratos.map((p) => (
            <div
              key={p.id}
              role="button" tabIndex={0}
              onClick={() => onEditar(p.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEditar(p.id) } }}
              className="panel flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3.5 transition-transform hover:scale-[1.01]"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-bold text-white">{p.nome}</div>
                <div className="text-xs font-medium text-white/50">
                  Custo {brl(p.custo)} · markup {p.markup.toFixed(1).replace('.', ',')}x
                </div>
              </div>
              <div className="text-[17px] font-extrabold tabular-nums" style={{ color: 'var(--orange)' }}>{brl(p.precoVenda)}</div>
              <BotaoAcao onClick={() => onEditar(p.id)} label="Editar prato" hover="var(--orange)"><IconLapis /></BotaoAcao>
              <BotaoAcao onClick={() => onExcluir(p.id)} label="Excluir prato" hover="var(--red)"><IconLixeira /></BotaoAcao>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
