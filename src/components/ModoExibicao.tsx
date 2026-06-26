import { useEffect, useState } from 'react'
import { useMonitor, type ItemRanking } from '../hooks/useMonitor'

const GRAD = 'var(--accent-grad)'

function brl(valor: number) {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`
}

// ─── Relógio com segundos (estilo "AO VIVO") ────────────────────────────────────

function RelogioVivo() {
  const [agora, setAgora] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-2"
      style={{ background: 'var(--w-05)', border: '1px solid var(--bd-07)' }}
    >
      <span
        className="h-2.5 w-2.5 flex-none rounded-full"
        style={{ background: 'var(--red)', boxShadow: '0 0 10px var(--red)', animation: 'livedot 1.4s ease-in-out infinite' }}
      />
      <span className="text-[13px] font-bold tracking-[0.2em]" style={{ color: 'var(--red)' }}>AO VIVO</span>
      <span className="text-[15px] font-bold tabular-nums tracking-wider" style={{ color: 'var(--tx-72)' }}>{hora}</span>
    </div>
  )
}

// ─── KPI grande ──────────────────────────────────────────────────────────────────

function KpiGrande({
  rotulo,
  valor,
  sub,
  destaque = false,
}: {
  rotulo: string
  valor: string
  sub?: string
  destaque?: boolean
}) {
  return (
    <div className="panel relative overflow-hidden rounded-3xl px-7 py-6">
      {destaque && (
        <span className="absolute inset-y-5 right-0 w-1 rounded-full" style={{ background: 'var(--accent-strip)' }} />
      )}
      <p
        className="text-[clamp(11px,0.9vw,15px)] font-bold uppercase tracking-[0.18em]"
        style={{ color: destaque ? 'var(--orange)' : 'var(--tx-40)' }}
      >
        {rotulo}
      </p>
      <p
        className="mt-2 font-extrabold tabular-nums leading-none"
        style={{
          color: destaque ? 'var(--tx)' : 'var(--tx)',
          fontSize: destaque ? 'clamp(44px,5.2vw,104px)' : 'clamp(32px,3.4vw,68px)',
        }}
      >
        {valor}
      </p>
      {sub && (
        <p className="mt-3 text-[clamp(11px,0.95vw,16px)] font-medium" style={{ color: 'var(--tx-40)' }}>
          {sub}
        </p>
      )}
    </div>
  )
}

// ─── Painel de ranking ─────────────────────────────────────────────────────────

function PainelRanking({ titulo, itens, vazio }: { titulo: string; itens: ItemRanking[]; vazio: string }) {
  const max = itens[0]?.total ?? 1
  return (
    <div className="panel flex flex-col rounded-3xl p-7">
      <h3
        className="mb-6 text-[clamp(11px,0.9vw,15px)] font-bold uppercase tracking-[0.18em]"
        style={{ color: 'var(--orange)' }}
      >
        {titulo}
      </h3>
      {itens.length === 0 ? (
        <p className="text-[clamp(13px,1vw,18px)]" style={{ color: 'var(--tx-30)' }}>{vazio}</p>
      ) : (
        <div className="flex flex-1 flex-col justify-between gap-5">
          {itens.map((it, i) => (
            <div key={it.nome}>
              <div className="flex items-baseline justify-between">
                <span className="text-[clamp(15px,1.4vw,26px)] font-bold" style={{ color: 'var(--tx-85)' }}>
                  <span className="mr-1.5" style={{ color: 'var(--tx-35)' }}>{i + 1}º</span>
                  {it.nome}
                </span>
                <span
                  className="text-[clamp(15px,1.4vw,26px)] font-extrabold tabular-nums"
                  style={{ color: 'var(--tx)' }}
                >
                  {brl(it.total)}
                </span>
              </div>
              <div className="mt-2.5 h-2 overflow-hidden rounded-full" style={{ background: 'var(--w-06)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(6, (it.total / max) * 100)}%`,
                    background: 'var(--bar-grad)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Modo de exibição (tela cheia para TVs) ─────────────────────────────────────

export default function ModoExibicao({ onClose }: { onClose: () => void }) {
  const d = useMonitor()

  // Entra em fullscreen real ao abrir; sai ao fechar.
  useEffect(() => {
    const el = document.documentElement
    el.requestFullscreen?.().catch(() => { /* navegador pode bloquear sem gesto */ })

    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    // O Escape do navegador só encerra o fullscreen; fechamos o modo junto.
    function aoSairFullscreen() {
      if (!document.fullscreenElement) onClose()
    }
    document.addEventListener('keydown', aoTeclar)
    document.addEventListener('fullscreenchange', aoSairFullscreen)

    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.removeEventListener('fullscreenchange', aoSairFullscreen)
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
    }
  }, [onClose])

  return (
    <div className="anim-fade fixed inset-0 z-[70] flex flex-col bg-app" style={{ background: 'var(--bg-app)' }}>
      {/* ── Cabeçalho ── */}
      <header className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl"
            style={{ background: GRAD, boxShadow: '0 8px 22px rgba(240,70,78,.4)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </div>
          <div>
            <div className="text-[clamp(18px,1.6vw,30px)] font-extrabold leading-none" style={{ color: 'var(--tx)' }}>
              Petiscaria Aquino
            </div>
            <div className="mt-1.5 text-[clamp(10px,0.8vw,14px)] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--tx-40)' }}>
              Monitor de Desperdício
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <RelogioVivo />
          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-[14px] font-bold transition-colors hover:opacity-80"
            style={{ background: 'var(--w-05)', border: '1px solid var(--bd-07)', color: 'var(--tx-72)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
            Sair
          </button>
        </div>
      </header>

      {/* ── Conteúdo ── */}
      <div className="flex min-h-0 flex-1 flex-col gap-5 px-8 pb-8">
        {/* KPIs */}
        <div className="grid flex-none gap-5" style={{ gridTemplateColumns: '1.5fr 1fr 1fr' }}>
          <KpiGrande
            rotulo="Desperdício do dia"
            valor={brl(d.totalDia)}
            sub={`${d.registrosDia} lançamento${d.registrosDia === 1 ? '' : 's'}${d.maiorDoDia ? ` · maior: ${d.maiorDoDia}` : ''}`}
            destaque
          />
          <KpiGrande
            rotulo="Desperdício do mês"
            valor={brl(d.totalMes)}
            sub={`${d.registrosMes} lançamentos`}
          />
          <KpiGrande
            rotulo="Média por dia"
            valor={brl(d.mediaPorDia)}
            sub={`projeção: ${brl(d.projecaoMes)}`}
          />
        </div>

        {/* Rankings */}
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-5">
          <PainelRanking titulo="Produtos desperdiçados" itens={d.topAlimentos} vazio="Sem dados no mês." />
          <PainelRanking titulo="Principais motivos" itens={d.topMotivos} vazio="Sem dados no mês." />
        </div>
      </div>
    </div>
  )
}
