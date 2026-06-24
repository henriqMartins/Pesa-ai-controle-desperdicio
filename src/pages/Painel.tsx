import { useState } from 'react'
import { useRegistrosFiltro } from '../hooks/useRegistrosFiltro'
import { calcularPeriodo, type PeriodoRapido, type Periodo } from '../lib/filtros'
import { exportarExcel, exportarPDF } from '../lib/exportar'
import { exibirQuantidade } from '../lib/unidades'

function brl(valor: number) {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`
}

function formatarDataHora(iso: string) {
  const d = new Date(iso)
  const hoje = new Date()
  const ontem = new Date()
  ontem.setDate(hoje.getDate() - 1)
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === hoje.toDateString()) return `hoje ${hora}`
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

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">

      {/* ── Filtro de período ── */}
      <section className="rounded-xl bg-gray-50 p-3 ring-1 ring-gray-200">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['hoje', 'Hoje'],
              ['semana', 'Últimos 7 dias'],
              ['mes', 'Este mês'],
            ] as [Exclude<PeriodoRapido, 'personalizado'>, string][]
          ).map(([p, label]) => (
            <button
              key={p}
              onClick={() => selecionarRapido(p)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                periodoRapido === p
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => setPeriodoRapido('personalizado')}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              periodoRapido === 'personalizado'
                ? 'bg-teal-600 text-white'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
            }`}
          >
            Personalizado
          </button>
        </div>

        {periodoRapido === 'personalizado' && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={customDe}
              onChange={(e) => setCustomDe(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
            />
            <span className="text-sm text-gray-400">até</span>
            <input
              type="date"
              value={customAte}
              onChange={(e) => setCustomAte(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
            />
            <button
              onClick={aplicarCustom}
              disabled={!customDe || !customAte}
              className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-40"
            >
              Aplicar
            </button>
          </div>
        )}

        <p className="mt-1.5 text-xs text-gray-400">{periodoAtivo.label}</p>
      </section>

      {/* ── Cards de resumo ── */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Total desperdiçado
            </p>
            <p className="mt-1 text-3xl font-bold text-teal-700">{brl(total)}</p>
            <p className="mt-0.5 text-xs text-gray-400">{periodoAtivo.label}</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Registros</p>
            <p className="mt-1 text-3xl font-bold text-teal-700">{registros.length}</p>
            <p className="mt-0.5 text-xs text-gray-400">{periodoAtivo.label}</p>
          </div>
        </div>
      )}

      {/* ── Exportar ── */}
      {!loading && registros.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={() => exportarExcel(dadosExport)}
            className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
          >
            Exportar Excel
          </button>
          <button
            onClick={() => exportarPDF(dadosExport)}
            className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
          >
            Exportar PDF
          </button>
        </div>
      )}

      {/* ── Top alimentos ── */}
      {!loading && topAlimentos.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Top alimentos
          </h2>
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                  <th className="px-4 py-2 font-medium">#</th>
                  <th className="px-4 py-2 font-medium">Alimento</th>
                  <th className="px-4 py-2 text-right font-medium">Total (R$)</th>
                  <th className="px-4 py-2 text-right font-medium">Qtd. total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topAlimentos.map((a, i) => (
                  <tr key={a.nome}>
                    <td className="px-4 py-2.5 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{a.nome}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-teal-700">
                      {brl(a.total)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-500">
                      {a.quantidadeTotal.toFixed(3).replace(/\.?0+$/, '')} {a.unidade}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Ranking de funcionários ── */}
      {!loading && ranking.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Ranking de funcionários
          </h2>
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                  <th className="px-4 py-2 font-medium">#</th>
                  <th className="px-4 py-2 font-medium">Funcionário</th>
                  <th className="px-4 py-2 text-right font-medium">Total (R$)</th>
                  <th className="px-4 py-2 text-right font-medium">Registros</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ranking.map((f, i) => (
                  <tr key={f.nome}>
                    <td className="px-4 py-2.5 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{f.nome}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-teal-700">
                      {brl(f.total)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-500">{f.quantidade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Lista de registros ── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Registros
        </h2>

        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        )}

        {!loading && registros.length === 0 && (
          <p className="rounded-xl bg-white px-4 py-6 text-center text-gray-400 ring-1 ring-gray-100">
            Nenhum registro no período selecionado.
          </p>
        )}

        {!loading && registros.length > 0 && (
          <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
            {registros.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className="font-medium text-gray-800">{r.alimentos.nome}</span>
                  <span className="mx-2 text-gray-300">·</span>
                  <span className="text-sm text-gray-500">
                    {exibirQuantidade(Number(r.quantidade), r.unidade_registro, r.alimentos.unidade)}
                  </span>
                  <span className="mx-2 text-gray-300">·</span>
                  <span className="text-sm text-gray-500">{r.funcionarios.nome}</span>
                  <p className="text-xs text-gray-400">{formatarDataHora(r.criado_em)}</p>
                </div>
                <span className="ml-4 shrink-0 font-semibold text-teal-700">
                  {brl(Number(r.custo))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
