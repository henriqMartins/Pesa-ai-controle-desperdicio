import { useMemo, useState } from 'react'
import { useRegistrosPeriodo } from '../hooks/useRegistrosPeriodo'
import { useIsMobile } from '../hooks/useIsMobile'
import { FUSO } from '../lib/fuso'
import { exibirQuantidade } from '../lib/unidades'
import {
  fxRange,
  porProduto,
  produtosDistintos,
  topRegistrados,
  topValor,
  type ModoFiltro,
  type PeriodoFiltro,
} from '../lib/filtros'
import type { RegistroCompleto } from '../types'

function brl(valor: number) {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`
}

function dataCurta(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    timeZone: FUSO,
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

function horaCurta(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    timeZone: FUSO,
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** "2 un · Validade vencida · 25/06/26 · 12:10" — metadados de um lançamento. */
function metaRegistro(r: RegistroCompleto) {
  const qtd = exibirQuantidade(Number(r.quantidade), r.unidade_registro, r.alimentos.unidade)
  const motivo = r.motivo?.trim() || 'Sem motivo'
  return `${qtd} · ${motivo} · ${dataCurta(r.criado_em)} · ${horaCurta(r.criado_em)}`
}

// ─── Estilos de botão (seguem CHIP_ACTIVE/CHIP_IDLE do RegistrarModal) ─────────

const MODO_ATIVO: React.CSSProperties = {
  background: 'var(--chip-active-bg)',
  border: '1.5px solid var(--orange)',
  color: 'var(--chip-active-tx)',
}
const MODO_IDLE: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1.5px solid var(--bd-10)',
  color: 'var(--tx-55)',
}
const PERIODO_ATIVO: React.CSSProperties = {
  border: '1.5px solid var(--orange)',
  color: 'var(--orange)',
  background: 'transparent',
}
const PERIODO_IDLE: React.CSSProperties = {
  border: '1.5px solid var(--bd-10)',
  color: 'var(--tx-55)',
  background: 'transparent',
}

const MODOS: { valor: ModoFiltro; label: string }[] = [
  { valor: 'topProd', label: 'Mais registrados' },
  { valor: 'topValor', label: 'Maior valor' },
  { valor: 'porProduto', label: 'Por produto' },
]

const PERIODOS: { valor: PeriodoFiltro; label: string }[] = [
  { valor: '7d', label: '7 dias' },
  { valor: '30d', label: '30 dias' },
  { valor: 'mes', label: 'Mês' },
  { valor: 'total', label: 'Total' },
  { valor: 'range', label: 'Período' },
]

const ROTULO_PERIODO: Record<PeriodoFiltro, string> = {
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  mes: 'Este mês',
  total: 'Todo o período',
  range: 'Período personalizado',
}

const CAPTION_MODO: Record<ModoFiltro, string> = {
  topProd: 'Mais registrados',
  topValor: 'Maiores valores',
  porProduto: 'Por produto',
}

function Titulo({ txt }: { txt: string }) {
  return (
    <div className="mb-2.5 text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--tx-40)' }}>
      {txt}
    </div>
  )
}

export default function FiltrosModal({ onClose }: { onClose: () => void }) {
  const isMobile = useIsMobile()
  const [modo, setModo] = useState<ModoFiltro>('topProd')
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('30d')
  const [de, setDe] = useState('')
  const [ate, setAte] = useState('')
  const [produtoSel, setProdutoSel] = useState('')
  // "Agora" congelado na abertura do modal → o recorte de datas fica estável e
  // não refaz a consulta a cada render (só quando período/datas mudam).
  const [agora] = useState(() => new Date())

  const range = useMemo<[number, number]>(
    () => fxRange(periodo, de || undefined, ate || undefined, agora),
    [periodo, de, ate, agora],
  )
  const { registros, loading, erro } = useRegistrosPeriodo(range)

  // Recorte único por período; os 3 modos derivam dele (troca de modo não refaz
  // a consulta — os dados já estão em memória).
  const linhasProd = useMemo(() => topRegistrados(registros), [registros])
  const porValor = useMemo(() => topValor(registros), [registros])
  const produtos = useMemo(() => produtosDistintos(registros), [registros])
  const resumo = useMemo(
    () => (produtoSel ? porProduto(registros, produtoSel) : null),
    [registros, produtoSel],
  )

  const caption = `${CAPTION_MODO[modo]} · ${ROTULO_PERIODO[periodo]}`.toUpperCase()
  const semDados = !loading && !erro && registros.length === 0

  // ─── Área de resultado por modo ──────────────────────────────────────────

  const maxRegistros = linhasProd[0]?.registros ?? 1

  const resultado = (() => {
    if (loading) {
      return <p className="py-8 text-center text-sm" style={{ color: 'var(--tx-40)' }}>Carregando…</p>
    }
    if (erro) {
      return <p className="py-8 text-center text-sm" style={{ color: 'var(--red)' }}>Não foi possível carregar: {erro}</p>
    }
    if (semDados) {
      return <p className="py-8 text-center text-sm" style={{ color: 'var(--tx-35)' }}>Sem registros no período.</p>
    }

    // ── Modo 1: Mais registrados ──
    if (modo === 'topProd') {
      return (
        <div className="space-y-4">
          {linhasProd.map((l, i) => (
            <div key={l.nome}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-bold" style={{ color: 'var(--tx-85)' }}>
                  <span style={{ color: 'var(--tx-35)' }}>{i + 1}º</span> {l.nome}
                </span>
                <span className="font-bold tabular-nums" style={{ color: 'var(--orange)' }}>
                  {l.registros} {l.registros === 1 ? 'registro' : 'registros'}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--w-06)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(6, (l.registros / maxRegistros) * 100)}%`, background: 'var(--bar-grad)' }}
                />
              </div>
              <div className="mt-1 text-[11px]" style={{ color: 'var(--tx-40)' }}>
                valor total: {brl(l.total)}
              </div>
            </div>
          ))}
        </div>
      )
    }

    // ── Modo 2: Maior valor ──
    if (modo === 'topValor') {
      const heroi = porValor[0]
      return (
        <div className="space-y-3">
          {heroi && (
            <div
              className="rounded-xl px-4 py-3"
              style={{ background: 'var(--chip-active-bg)', border: '1px solid var(--orange)' }}
            >
              <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--tx-40)' }}>
                Maior registro
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-extrabold" style={{ color: 'var(--tx)' }}>{heroi.alimentos.nome}</div>
                  <div className="mt-0.5 text-[11px]" style={{ color: 'var(--tx-40)' }}>{metaRegistro(heroi)}</div>
                </div>
                <div className="flex-none text-xl font-extrabold tabular-nums" style={{ color: 'var(--orange)' }}>
                  {brl(Number(heroi.custo))}
                </div>
              </div>
            </div>
          )}
          <div>
            {porValor.map((r, i) => (
              <div
                key={r.id}
                className="flex items-baseline justify-between gap-3 py-2.5"
                style={{ borderBottom: '1px solid var(--bd-05)' }}
              >
                <div className="min-w-0">
                  <div className="text-sm font-bold" style={{ color: 'var(--tx-85)' }}>
                    <span style={{ color: 'var(--tx-35)' }}>{i + 1}º</span> {r.alimentos.nome}
                  </div>
                  <div className="mt-0.5 text-[11px]" style={{ color: 'var(--tx-40)' }}>{metaRegistro(r)}</div>
                </div>
                <span className="flex-none text-sm font-bold tabular-nums" style={{ color: 'var(--orange)' }}>
                  {brl(Number(r.custo))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    }

    // ── Modo 3: Por produto ──
    return (
      <div>
        <Titulo txt="Produto" />
        <select
          value={produtoSel}
          onChange={(e) => setProdutoSel(e.target.value)}
          className="field mb-3"
        >
          <option value="">Selecione um produto…</option>
          {produtos.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {!produtoSel ? (
          <p className="py-6 text-center text-sm" style={{ color: 'var(--tx-35)' }}>
            Selecione um produto para ver todas as datas em que foi registrado.
          </p>
        ) : resumo && resumo.ocorrencias > 0 ? (
          <>
            <div>
              {resumo.registros.map((r) => (
                <div
                  key={r.id}
                  className="flex items-baseline justify-between gap-3 py-2.5"
                  style={{ borderBottom: '1px solid var(--bd-05)' }}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold" style={{ color: 'var(--tx-85)' }}>
                      {dataCurta(r.criado_em)} · {horaCurta(r.criado_em)}
                    </div>
                    <div className="mt-0.5 text-[11px]" style={{ color: 'var(--tx-40)' }}>
                      {exibirQuantidade(Number(r.quantidade), r.unidade_registro, r.alimentos.unidade)} · {r.motivo?.trim() || 'Sem motivo'}
                    </div>
                  </div>
                  <span className="flex-none text-sm font-bold tabular-nums" style={{ color: 'var(--orange)' }}>
                    {brl(Number(r.custo))}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-baseline justify-between text-sm font-bold">
              <span style={{ color: 'var(--tx-55)' }}>
                {resumo.ocorrencias} {resumo.ocorrencias === 1 ? 'registro' : 'registros'}
              </span>
              <span className="tabular-nums" style={{ color: 'var(--orange)' }}>{brl(resumo.total)}</span>
            </div>
          </>
        ) : (
          <p className="py-6 text-center text-sm" style={{ color: 'var(--tx-35)' }}>
            Este produto não foi registrado no período.
          </p>
        )}
      </div>
    )
  })()

  // ─── Layout ────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex anim-fade"
      style={{
        background: 'var(--overlay)',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        className={isMobile ? 'anim-sheet w-full' : 'anim-pop w-full'}
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--bd-10)',
          maxWidth: isMobile ? '100%' : 460,
          maxHeight: isMobile ? '92dvh' : '90dvh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: isMobile ? '24px 24px 0 0' : 20,
          boxShadow: '0 -8px 40px rgba(0,0,0,.5)',
          paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {isMobile && (
          <div className="flex justify-center pt-3">
            <div className="h-1.5 w-12 rounded-full bg-white/20" />
          </div>
        )}

        {/* ── Cabeçalho ── */}
        <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-5">
          <div>
            <div className="text-lg font-extrabold" style={{ color: 'var(--tx)' }}>Filtros avançados</div>
            <div className="mt-0.5 text-xs" style={{ color: 'var(--tx-45)' }}>cruze produtos, valores e datas por período</div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 flex-none items-center justify-center rounded-full hover:opacity-80"
            style={{ border: '1px solid var(--bd-15)', color: 'var(--tx-50)' }}
            aria-label="fechar"
          >
            ✕
          </button>
        </div>

        {/* ── Corpo rolável ── */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
          {/* Seletor de modo */}
          <Titulo txt="Filtrar por" />
          <div className="mb-4 flex gap-2">
            {MODOS.map((m) => (
              <button
                key={m.valor}
                onClick={() => setModo(m.valor)}
                className="flex-1 rounded-xl px-2 py-2.5 text-[13px] font-bold transition-colors"
                style={modo === m.valor ? MODO_ATIVO : MODO_IDLE}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Seletor de período */}
          <Titulo txt="Período" />
          <div className="mb-4 flex flex-wrap gap-2">
            {PERIODOS.map((p) => (
              <button
                key={p.valor}
                onClick={() => setPeriodo(p.valor)}
                className="rounded-lg px-3 py-1.5 text-[13px] font-bold transition-colors"
                style={periodo === p.valor ? PERIODO_ATIVO : PERIODO_IDLE}
              >
                {p.label}
              </button>
            ))}
          </div>

          {periodo === 'range' && (
            <div className="mb-4 grid grid-cols-2 gap-2">
              <label className="text-[11px] font-semibold" style={{ color: 'var(--tx-45)' }}>
                De
                <input type="date" value={de} max={ate || undefined} onChange={(e) => setDe(e.target.value)} className="field mt-1" />
              </label>
              <label className="text-[11px] font-semibold" style={{ color: 'var(--tx-45)' }}>
                Até
                <input type="date" value={ate} min={de || undefined} onChange={(e) => setAte(e.target.value)} className="field mt-1" />
              </label>
            </div>
          )}

          {/* Resultado */}
          <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--bd-08)' }}>
            {!loading && !erro && !semDados && (
              <div className="mb-3 text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--tx-40)' }}>
                {caption}
              </div>
            )}
            {resultado}
          </div>
        </div>

        {/* ── Rodapé ── */}
        <div className="px-5 pb-5 pt-1">
          <button onClick={onClose} className="btn-accent w-full rounded-xl py-3.5 text-base font-extrabold">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
