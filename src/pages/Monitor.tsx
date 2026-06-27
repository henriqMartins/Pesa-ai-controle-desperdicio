import { useState } from 'react'
import { useMonitor, type ItemRanking } from '../hooks/useMonitor'
import { useAlimentos } from '../hooks/useAlimentos'
import { exportarExcel, exportarPDF } from '../lib/exportar'
import RegistrarModal from '../components/RegistrarModal'
import type { RegistroCompleto } from '../types'

function brl(valor: number) {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`
}

function formatarDataHora(iso: string) {
  const d = new Date(iso)
  const hoje = new Date()
  const ontem = new Date(); ontem.setDate(hoje.getDate() - 1)
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === hoje.toDateString()) return `hoje ${hora}`
  if (d.toDateString() === ontem.toDateString()) return `ontem ${hora}`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ` ${hora}`
}

// ─── KPI ────────────────────────────────────────────────────────────────────────

function Kpi({ rotulo, valor, sub }: { rotulo: string; valor: string; sub?: string }) {
  return (
    <div className="panel rounded-2xl px-5 py-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{rotulo}</p>
      <p className="mt-2 text-3xl font-extrabold tabular-nums" style={{ color: 'var(--orange)' }}>{valor}</p>
      {sub && <p className="mt-0.5 text-xs text-white/35">{sub}</p>}
    </div>
  )
}

// ─── Painel de ranking com barras ──────────────────────────────────────────────

function PainelRanking({ titulo, itens, vazio }: { titulo: string; itens: ItemRanking[]; vazio: string }) {
  const max = itens[0]?.total ?? 1
  return (
    <div className="panel rounded-2xl p-4">
      <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/40">{titulo}</h3>
      {itens.length === 0 && <p className="text-sm text-white/30">{vazio}</p>}
      <div className="space-y-3">
        {itens.map((it, i) => (
          <div key={it.nome}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-semibold text-white/85">
                <span className="text-white/35">{i + 1}º</span> {it.nome}
              </span>
              <span className="font-bold tabular-nums" style={{ color: 'var(--orange)' }}>{brl(it.total)}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--w-06)' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(6, (it.total / max) * 100)}%`, background: 'var(--bar-grad)' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Página ──────────────────────────────────────────────────────────────────────

export default function Monitor() {
  const d = useMonitor()
  const { alimentos } = useAlimentos()
  const [editando, setEditando] = useState<RegistroCompleto | null>(null)

  async function apagar(r: RegistroCompleto) {
    const ok = window.confirm(
      `Excluir o lançamento de ${r.alimentos.nome} (${brl(Number(r.custo))}) de ${r.funcionarios.nome}?`,
    )
    if (!ok) return
    try {
      await d.excluir(r.id)
    } catch (e) {
      window.alert('Não foi possível excluir: ' + (e instanceof Error ? e.message : 'erro'))
    }
  }

  const labelMes = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const dadosExport = {
    registros: d.registrosMesLista,
    topAlimentos: d.topAlimentos.map((a) => ({
      nome: a.nome,
      total: a.total,
      quantidadeTotal: a.quantidadeTotal,
      unidade: a.unidade,
      quantidade: a.registros,
    })),
    ranking: d.rankingFuncionarios.map((f) => ({ nome: f.nome, total: f.total, quantidade: f.registros })),
    total: d.totalMes,
    label: labelMes,
  }

  if (d.loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl" style={{ background: 'var(--surface)' }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* ── 3 KPIs ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Kpi
          rotulo="Desperdício do dia"
          valor={brl(d.totalDia)}
          sub={`${d.registrosDia} lançamento${d.registrosDia === 1 ? '' : 's'}${d.maiorDoDia ? ` · maior: ${d.maiorDoDia}` : ''}`}
        />
        <Kpi rotulo="Desperdício do mês" valor={brl(d.totalMes)} sub={`${d.registrosMes} lançamentos · ${labelMes}`} />
        <Kpi rotulo="Média por dia" valor={brl(d.mediaPorDia)} sub={`projeção do mês: ${brl(d.projecaoMes)}`} />
      </div>

      {/* ── Exportar ── */}
      {d.registrosMes > 0 && (
        <div className="flex gap-2">
          {[
            { label: 'Exportar Excel', fn: () => exportarExcel(dadosExport) },
            { label: 'Exportar PDF', fn: () => exportarPDF(dadosExport) },
          ].map(({ label, fn }) => (
            <button
              key={label}
              onClick={fn}
              className="rounded-xl px-3 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ background: 'var(--surface)', border: '1px solid var(--bd-10)', color: 'var(--tx-65)' }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── 3 painéis ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Últimos lançamentos */}
        <div className="panel rounded-2xl p-4">
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/40">Últimos lançamentos</h3>
          {d.ultimos.length === 0 && <p className="text-sm text-white/30">Nenhum registro ainda.</p>}
          <div>
            {d.ultimos.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-2 py-2"
                style={{ borderBottom: '1px solid var(--bd-05)' }}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white/85">{r.alimentos.nome}</div>
                  <div className="text-[11px] text-white/35">{r.funcionarios.nome} · {formatarDataHora(r.criado_em)}</div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--orange)' }}>
                    {brl(Number(r.custo))}
                  </span>
                  <button
                    onClick={() => setEditando(r)}
                    aria-label="Editar lançamento"
                    title="Editar"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition-colors hover:text-[var(--orange)]"
                    style={{ border: '1px solid var(--bd-08)' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => apagar(r)}
                    aria-label="Excluir lançamento"
                    title="Excluir"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition-colors hover:text-[var(--red)]"
                    style={{ border: '1px solid var(--bd-08)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <PainelRanking titulo="+ Desperdiçados" itens={d.topAlimentos} vazio="Sem dados no mês." />
        <PainelRanking titulo="Principais motivos" itens={d.topMotivos} vazio="Sem dados no mês." />
      </div>
    </div>

      {editando && (
        <RegistrarModal
          registro={editando}
          alimentoInicial={alimentos.find((a) => a.id === editando.alimento_id) ?? null}
          onClose={() => setEditando(null)}
          onRegistrado={() => {
            setEditando(null)
            d.recarregar()
          }}
        />
      )}
    </>
  )
}
