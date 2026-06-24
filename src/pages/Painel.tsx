import { useState } from 'react'
import { useRegistrosFiltro } from '../hooks/useRegistrosFiltro'
import { calcularPeriodo, type PeriodoRapido, type Periodo } from '../lib/filtros'
import { exportarExcel, exportarPDF } from '../lib/exportar'
import { exibirQuantidade } from '../lib/unidades'

const GRAD = 'linear-gradient(135deg, #ff8a4c, #f0464e)'

function brl(valor: number) {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`
}

function formatarDataHora(iso: string) {
  const d = new Date(iso)
  const hoje = new Date()
  const ontem = new Date(); ontem.setDate(hoje.getDate() - 1)
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === hoje.toDateString())  return `hoje ${hora}`
  if (d.toDateString() === ontem.toDateString()) return `ontem ${hora}`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ` ${hora}`
}

export default function Painel() {
  const [periodoRapido, setPeriodoRapido] = useState<PeriodoRapido>('mes')
  const [customDe, setCustomDe] = useState('')
  const [customAte, setCustomAte] = useState('')
  const [periodoAtivo, setPeriodoAtivo] = useState<Periodo>(() => calcularPeriodo('mes'))

  const { registros, total, topAlimentos, ranking, loading } = useRegistrosFiltro(
    periodoAtivo.de,
    periodoAtivo.ate,
  )

  function selecionarRapido(p: Exclude<PeriodoRapido, 'personalizado'>) {
    setPeriodoRapido(p)
    setPeriodoAtivo(calcularPeriodo(p))
  }

  function aplicarCustom() {
    if (!customDe || !customAte) return
    setPeriodoAtivo(calcularPeriodo('personalizado', customDe, customAte))
  }

  const dadosExport = { registros, topAlimentos, ranking, total, label: periodoAtivo.label }

  const inputDateStyle: React.CSSProperties = {
    background: '#1c160f',
    border: '1px solid rgba(255,220,180,.15)',
    color: '#fff',
    borderRadius: '10px',
    padding: '6px 12px',
    fontSize: '13px',
    outline: 'none',
    colorScheme: 'dark',
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">

      {/* ── Filtro de período ── */}
      <section
        className="rounded-2xl p-3"
        style={{ background: '#1c160f', border: '1px solid rgba(255,220,180,.07)' }}
      >
        <div className="flex flex-wrap gap-2">
          {(
            [['hoje', 'Hoje'], ['semana', 'Últimos 7 dias'], ['mes', 'Este mês']] as
              [Exclude<PeriodoRapido, 'personalizado'>, string][]
          ).map(([p, label]) => (
            <button
              key={p}
              onClick={() => selecionarRapido(p)}
              className="rounded-xl px-3 py-2 text-sm font-semibold transition-opacity"
              style={periodoRapido === p
                ? { background: GRAD, color: '#fff', boxShadow: '0 4px 14px rgba(240,70,78,.22)' }
                : { background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.6)', border: '1px solid rgba(255,220,180,.08)' }
              }
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => setPeriodoRapido('personalizado')}
            className="rounded-xl px-3 py-2 text-sm font-semibold transition-opacity"
            style={periodoRapido === 'personalizado'
              ? { background: GRAD, color: '#fff', boxShadow: '0 4px 14px rgba(240,70,78,.22)' }
              : { background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.6)', border: '1px solid rgba(255,220,180,.08)' }
            }
          >
            Personalizado
          </button>
        </div>

        {periodoRapido === 'personalizado' && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input type="date" value={customDe} onChange={(e) => setCustomDe(e.target.value)} style={inputDateStyle} />
            <span className="text-sm text-white/35">até</span>
            <input type="date" value={customAte} onChange={(e) => setCustomAte(e.target.value)} style={inputDateStyle} />
            <button
              onClick={aplicarCustom}
              disabled={!customDe || !customAte}
              className="btn-accent rounded-xl px-3 py-1.5 text-sm font-bold"
            >
              Aplicar
            </button>
          </div>
        )}

        <p className="mt-2 text-xs text-white/35">{periodoAtivo.label}</p>
      </section>

      {/* ── Cards de resumo ── */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl" style={{ background: '#1c160f' }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div
            className="rounded-2xl px-5 py-5"
            style={{ background: '#1c160f', border: '1px solid rgba(255,220,180,.07)' }}
          >
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">
              Total desperdiçado
            </p>
            <p
              className="mt-2 text-3xl font-extrabold tabular-nums"
              style={{ color: '#ff8a4c' }}
            >
              {brl(total)}
            </p>
            <p className="mt-0.5 text-xs text-white/35">{periodoAtivo.label}</p>
          </div>
          <div
            className="rounded-2xl px-5 py-5"
            style={{ background: '#1c160f', border: '1px solid rgba(255,220,180,.07)' }}
          >
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">Registros</p>
            <p className="mt-2 text-3xl font-extrabold" style={{ color: '#ff8a4c' }}>
              {registros.length}
            </p>
            <p className="mt-0.5 text-xs text-white/35">{periodoAtivo.label}</p>
          </div>
        </div>
      )}

      {/* ── Exportar ── */}
      {!loading && registros.length > 0 && (
        <div className="flex gap-2">
          {[
            { label: 'Exportar Excel', fn: () => exportarExcel(dadosExport) },
            { label: 'Exportar PDF',   fn: () => exportarPDF(dadosExport) },
          ].map(({ label, fn }) => (
            <button
              key={label}
              onClick={fn}
              className="rounded-xl px-3 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ background: '#1c160f', border: '1px solid rgba(255,220,180,.1)', color: 'rgba(255,255,255,.65)' }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Top alimentos ── */}
      {!loading && topAlimentos.length > 0 && (
        <section>
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-white/40">
            Top alimentos
          </h2>
          <div
            className="overflow-x-auto rounded-2xl"
            style={{ background: '#1c160f', border: '1px solid rgba(255,220,180,.07)' }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,220,180,.06)' }}>
                  {['#', 'Alimento', 'Total (R$)', 'Qtd. total', 'Registros'].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/35 ${['Total (R$)', 'Qtd. total', 'Registros'].includes(h) ? 'text-right' : 'text-left'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topAlimentos.map((a, i) => (
                  <tr key={a.nome} style={{ borderBottom: '1px solid rgba(255,220,180,.04)' }}>
                    <td className="px-4 py-3 text-white/35">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-white">{a.nome}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums" style={{ color: '#ff8a4c' }}>
                      {brl(a.total)}
                    </td>
                    <td className="px-4 py-3 text-right text-white/50">
                      {a.quantidadeTotal.toFixed(3).replace(/\.?0+$/, '')} {a.unidade}
                    </td>
                    <td className="px-4 py-3 text-right text-white/50">{a.quantidade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Ranking funcionários ── */}
      {!loading && ranking.length > 0 && (
        <section>
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-white/40">
            Ranking de funcionários
          </h2>
          <div
            className="overflow-x-auto rounded-2xl"
            style={{ background: '#1c160f', border: '1px solid rgba(255,220,180,.07)' }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,220,180,.06)' }}>
                  {['#', 'Funcionário', 'Total (R$)', 'Registros'].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/35 ${h === 'Total (R$)' || h === 'Registros' ? 'text-right' : 'text-left'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ranking.map((f, i) => (
                  <tr key={f.nome} style={{ borderBottom: '1px solid rgba(255,220,180,.04)' }}>
                    <td className="px-4 py-3 text-white/35">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-white">{f.nome}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums" style={{ color: '#ff8a4c' }}>
                      {brl(f.total)}
                    </td>
                    <td className="px-4 py-3 text-right text-white/50">{f.quantidade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Lista de registros ── */}
      <section>
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-white/40">
          Registros
        </h2>

        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl" style={{ background: '#1c160f' }} />
            ))}
          </div>
        )}

        {!loading && registros.length === 0 && (
          <div
            className="rounded-2xl px-4 py-8 text-center text-sm text-white/40"
            style={{ background: '#1c160f', border: '1px solid rgba(255,220,180,.07)' }}
          >
            Nenhum registro no período selecionado.
          </div>
        )}

        {!loading && registros.length > 0 && (
          <div
            className="overflow-hidden rounded-2xl"
            style={{ background: '#1c160f', border: '1px solid rgba(255,220,180,.07)' }}
          >
            {registros.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between px-4 py-3.5"
                style={{ borderBottom: '1px solid rgba(255,220,180,.04)' }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{r.alimentos.nome}</span>
                    <span className="text-white/25">·</span>
                    <span className="text-sm text-white/50">
                      {exibirQuantidade(Number(r.quantidade), r.unidade_registro, r.alimentos.unidade)}
                    </span>
                    <span className="text-white/25">·</span>
                    <span className="text-sm text-white/50">{r.funcionarios.nome}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-white/35">{formatarDataHora(r.criado_em)}</p>
                </div>
                <span className="ml-4 shrink-0 font-bold tabular-nums" style={{ color: '#ff8a4c' }}>
                  {brl(Number(r.custo))}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
