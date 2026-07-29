import { useMemo, useState, type ReactNode } from 'react'
import { useMonitor, agregar, type ItemRanking } from '../hooks/useMonitor'
import { useAlimentos } from '../hooks/useAlimentos'
import { useRegistrosPeriodo } from '../hooks/useRegistrosPeriodo'
import { exportarExcel, exportarPDF } from '../lib/exportar'
import { FUSO, diaEmSP, inicioDoDiaSP } from '../lib/fuso'
import { filtrarPeriodoPainel, type PeriodoPainel } from '../lib/filtros'
import RegistrarModal from '../components/RegistrarModal'
import type { RegistroCompleto } from '../types'

function brl(valor: number) {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`
}

function formatarDataHora(iso: string) {
  const d = new Date(iso)
  const dia = diaEmSP(d)
  const hoje = diaEmSP()
  // Ontem em SP: 1ms antes da meia-noite de hoje (robusto a virada de mês).
  const ontem = diaEmSP(new Date(inicioDoDiaSP().getTime() - 1))
  const hora = d.toLocaleTimeString('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit' })
  if (dia === hoje) return `hoje ${hora}`
  if (dia === ontem) return `ontem ${hora}`
  return d.toLocaleDateString('pt-BR', { timeZone: FUSO, day: '2-digit', month: '2-digit' }) + ` ${hora}`
}

// ─── KPI ────────────────────────────────────────────────────────────────────────

function Kpi({ rotulo, valor, sub }: { rotulo: string; valor: string; sub?: string }) {
  return (
    <div className="panel rounded-2xl px-5 py-4">
      <p className="text-sm font-bold uppercase tracking-widest text-white/40">{rotulo}</p>
      <p className="mt-2 text-3xl font-extrabold tabular-nums" style={{ color: 'var(--orange)' }}>{valor}</p>
      {sub && <p className="mt-1 text-sm text-white/35">{sub}</p>}
    </div>
  )
}

// ─── Mini-filtro de período (chips por painel) ──────────────────────────────────

interface OpcaoPeriodo {
  valor: PeriodoPainel
  label: string
}

const CHIP_P_ATIVO: React.CSSProperties = {
  border: '1.5px solid var(--orange)',
  color: 'var(--orange)',
}
const CHIP_P_IDLE: React.CSSProperties = {
  border: '1.5px solid transparent',
  color: 'var(--tx-45)',
}

function ChipsPeriodo({
  opcoes,
  valor,
  onChange,
}: {
  opcoes: OpcaoPeriodo[]
  valor: PeriodoPainel
  onChange: (p: PeriodoPainel) => void
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {opcoes.map((o) => (
        <button
          key={o.valor}
          onClick={() => onChange(o.valor)}
          className="rounded-lg px-2 py-1 text-xs font-bold transition-colors"
          style={valor === o.valor ? CHIP_P_ATIVO : CHIP_P_IDLE}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

const PERIODOS_RANKING: OpcaoPeriodo[] = [
  { valor: 'hoje', label: 'Hoje' },
  { valor: 'ontem', label: 'Ontem' },
  { valor: 'mes', label: 'Mês' },
  { valor: 'total', label: 'Total' },
]

// ─── Painel de ranking com barras ──────────────────────────────────────────────

function PainelRanking({
  titulo,
  itens,
  vazio,
  acoes,
}: {
  titulo: string
  itens: ItemRanking[]
  vazio: string
  acoes?: ReactNode
}) {
  const max = itens[0]?.total ?? 1
  return (
    <div className="panel rounded-2xl p-4">
      <div className="mb-3 flex flex-col gap-2">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/40">{titulo}</h3>
        {acoes}
      </div>
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
  const [tentando, setTentando] = useState(false)

  // ── Mini-filtros de período (um estado por painel) ──
  const [pUlt, setPUlt] = useState<PeriodoPainel>('hoje')
  const [dataUlt, setDataUlt] = useState('') // usada quando pUlt === 'outra'
  const [pProd, setPProd] = useState<PeriodoPainel>('mes')
  const [pMot, setPMot] = useState<PeriodoPainel>('mes')

  // Hoje/Ontem/Mês cabem na carga do mês (useMonitor); "Total" e "Outra data"
  // ultrapassam o mês, então buscamos a base completa sob demanda — só quando
  // algum painel pede um desses períodos.
  const precisaBaseCompleta =
    [pProd, pMot].includes('total') || pUlt === 'total' || pUlt === 'outra'
  const [agoraTudo] = useState(() => Date.now())
  const baseCompleta = useRegistrosPeriodo(
    precisaBaseCompleta ? [0, agoraTudo] : null,
  )

  // Fonte de dados de um painel conforme o período escolhido.
  function fonte(periodo: PeriodoPainel): RegistroCompleto[] {
    return periodo === 'total' || periodo === 'outra'
      ? baseCompleta.registros
      : d.registrosMesLista
  }
  const carregandoExtra = precisaBaseCompleta && baseCompleta.loading

  const ultimosFiltrados = useMemo(
    () => filtrarPeriodoPainel(fonte(pUlt), pUlt, dataUlt || undefined).slice(0, 8),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pUlt, dataUlt, d.registrosMesLista, baseCompleta.registros],
  )
  const topAlimentosFiltrado = useMemo(
    () => agregar(filtrarPeriodoPainel(fonte(pProd), pProd)).topAlimentos,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pProd, d.registrosMesLista, baseCompleta.registros],
  )
  const topMotivosFiltrado = useMemo(
    () => agregar(filtrarPeriodoPainel(fonte(pMot), pMot)).topMotivos,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pMot, d.registrosMesLista, baseCompleta.registros],
  )
  const vazioRanking = carregandoExtra ? 'Carregando…' : 'Sem dados no período.'

  async function tentarDeNovo() {
    setTentando(true)
    try {
      await d.recarregar()
    } finally {
      setTentando(false)
    }
  }

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

  const labelMes = new Date().toLocaleDateString('pt-BR', { timeZone: FUSO, month: 'long', year: 'numeric' })

  // Falha na carga inicial (erro e nenhum dado carregado): esconde os KPIs/painéis
  // zerados — "R$ 0,00" pareceria "sem desperdício" em vez de "não carregou".
  const semDados = Boolean(d.erro) && d.registrosMesLista.length === 0

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
      <div className="mx-auto max-w-7xl px-4 py-8">
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
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      {/* ── Erro de carregamento + retry ── */}
      {d.erro && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3"
          style={{ background: 'var(--w-05)', border: '1px solid var(--red)' }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--red)"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none"
            >
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
            <span className="text-sm font-semibold" style={{ color: 'var(--tx-72)' }}>
              Não foi possível carregar os dados. {d.erro}
            </span>
          </div>
          <button
            onClick={tentarDeNovo}
            disabled={tentando}
            className="rounded-xl px-3 py-2 text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: 'var(--red)', color: '#fff' }}
          >
            {tentando ? 'Tentando…' : 'Tentar de novo'}
          </button>
        </div>
      )}

      {!semDados && (
      <>
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
          <div className="mb-3 flex flex-col gap-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/40">Últimos lançamentos</h3>
            <ChipsPeriodo
              opcoes={[
                { valor: 'hoje', label: 'Hoje' },
                { valor: 'ontem', label: 'Ontem' },
                { valor: 'outra', label: 'Outra' },
              ]}
              valor={pUlt}
              onChange={setPUlt}
            />
          </div>
          {pUlt === 'outra' && (
            <input
              type="date"
              value={dataUlt}
              onChange={(e) => setDataUlt(e.target.value)}
              className="field mb-3"
              style={{ padding: '6px 12px', fontSize: 13 }}
            />
          )}
          {carregandoExtra && (pUlt === 'total' || pUlt === 'outra') && (
            <p className="text-sm text-white/30">Carregando…</p>
          )}
          {!carregandoExtra && ultimosFiltrados.length === 0 && (
            <p className="text-sm text-white/30">
              {pUlt === 'outra' && !dataUlt ? 'Escolha uma data.' : 'Nenhum registro no período.'}
            </p>
          )}
          <div>
            {ultimosFiltrados.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-2 py-2"
                style={{ borderBottom: '1px solid var(--bd-05)' }}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white/85">{r.alimentos.nome}</div>
                  <div className="text-xs text-white/35">{r.funcionarios.nome} · {formatarDataHora(r.criado_em)}</div>
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

        <PainelRanking
          titulo="+ Desperdiçados"
          itens={topAlimentosFiltrado}
          vazio={vazioRanking}
          acoes={<ChipsPeriodo opcoes={PERIODOS_RANKING} valor={pProd} onChange={setPProd} />}
        />
        <PainelRanking
          titulo="Principais motivos"
          itens={topMotivosFiltrado}
          vazio={vazioRanking}
          acoes={<ChipsPeriodo opcoes={PERIODOS_RANKING} valor={pMot} onChange={setPMot} />}
        />
      </div>
      </>
      )}
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
