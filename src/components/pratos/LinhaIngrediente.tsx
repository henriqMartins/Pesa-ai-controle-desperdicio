// §4.3 — uma linha de ingrediente. Grade no desktop, mini-card no mobile,
// faixa de perda expansível. Componente puro: estado do valor vem por props;
// só o expandir/recolher da faixa de perda é estado local de UI.
import { useState } from 'react'
import { useIsMobile } from '../../hooks/useIsMobile'
import { OPCOES_TIPO, type IngredientePrato } from './tipos'
import { brl, custoFinalIngrediente, perdaPct, LIMIAR_PERDA } from './calculo.stub'

const dec = (v: string) => v.replace(/[^0-9.,]/g, '')

type Props = {
  ing: IngredientePrato
  calcularPerda: boolean
  onChange: (patch: Partial<IngredientePrato>) => void
  onRemover: () => void
}

// ─── átomos reaproveitados ────────────────────────────────────────────────────
function IconLixeira() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function BtnAcao({ onClick, label, children, hover = 'var(--red)' }: { onClick: () => void; label: string; children: React.ReactNode; hover?: string }) {
  const [h, setH] = useState(false)
  return (
    <button
      type="button" onClick={onClick} aria-label={label} title={label}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      className="flex h-7 w-7 flex-none items-center justify-center rounded-lg transition-colors"
      style={{ border: '1px solid var(--bd-10)', color: h ? hover : 'var(--tx-30)' }}
    >
      {children}
    </button>
  )
}

function FaixaPerda({ ing, onChange }: { ing: IngredientePrato; onChange: Props['onChange'] }) {
  const perda = perdaPct(ing)
  const corPerda = perda == null ? 'var(--tx-40)' : perda > LIMIAR_PERDA ? 'var(--red)' : 'var(--live-green)'
  const campo = (rotulo: string, val: string, key: 'pesoBrutoKg' | 'pesoLiquidoKg') => (
    <div className="flex-1">
      <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-white/45">{rotulo}</label>
      <input className="field" inputMode="decimal" placeholder="0,000" value={val} onChange={(e) => onChange({ [key]: dec(e.target.value) })} style={{ padding: '8px 10px', fontSize: 13 }} />
    </div>
  )
  return (
    <div className="mt-2 flex items-end gap-3 rounded-xl p-3" style={{ background: 'var(--w-05)', border: '1px solid var(--bd-07)' }}>
      {campo('Peso bruto (kg)', ing.pesoBrutoKg, 'pesoBrutoKg')}
      {campo('Peso líquido (kg)', ing.pesoLiquidoKg, 'pesoLiquidoKg')}
      <div className="flex-none pb-2 text-right">
        <div className="text-[9px] font-bold uppercase tracking-wider text-white/45">Perda</div>
        <div className="text-sm font-extrabold tabular-nums" style={{ color: corPerda }} aria-live="polite">
          {perda == null ? '—' : `${perda.toFixed(1)}%`}
        </div>
      </div>
    </div>
  )
}

export default function LinhaIngrediente({ ing, calcularPerda, onChange, onRemover }: Props) {
  const mobile = useIsMobile()
  const [aberta, setAberta] = useState(false)
  const custo = custoFinalIngrediente(ing, calcularPerda)

  const nome = (
    <input className="field" placeholder="ingrediente" value={ing.nome} onChange={(e) => onChange({ nome: e.target.value })} style={{ padding: '8px 12px', fontSize: 14 }} />
  )
  const tipo = (
    <select className="field" value={ing.tipo} onChange={(e) => onChange({ tipo: e.target.value as IngredientePrato['tipo'] })} style={{ padding: '8px 12px', fontSize: 14 }}>
      {OPCOES_TIPO.map((o) => <option key={o.valor} value={o.valor}>{o.label}</option>)}
    </select>
  )
  const valor = (
    <input className="field" inputMode="decimal" placeholder="0,00" value={ing.valor} onChange={(e) => onChange({ valor: dec(e.target.value) })} style={{ padding: '8px 10px', fontSize: 14 }} />
  )
  const qtd = (
    <input className="field" inputMode="decimal" placeholder="0" value={ing.qtd} onChange={(e) => onChange({ qtd: dec(e.target.value) })} style={{ padding: '8px 10px', fontSize: 14 }} />
  )
  const custoCel = (
    <div className="text-sm font-extrabold tabular-nums" style={{ color: 'var(--live-green)' }}>{brl(custo)}</div>
  )
  const btnPerda = calcularPerda && (
    <BtnAcao onClick={() => setAberta((v) => !v)} label={aberta ? 'Recolher perda' : 'Calcular perda'} hover="var(--orange)">
      <span style={{ fontSize: 12 }}>{aberta ? '▴' : '▾'}</span>
    </BtnAcao>
  )
  const btnRemover = <BtnAcao onClick={onRemover} label="Remover ingrediente"><IconLixeira /></BtnAcao>

  // ── Mobile: mini-card ──
  if (mobile) {
    return (
      <div className="rounded-xl p-3" style={{ background: 'var(--surface)', border: '1px solid var(--bd-08)' }}>
        <div className="flex items-center gap-2">
          <div className="flex-1">{nome}</div>
          <div className="flex gap-1.5">{btnPerda}{btnRemover}</div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="text-[9px] font-bold uppercase tracking-wider text-white/45">Tipo{tipo}</label>
          <label className="text-[9px] font-bold uppercase tracking-wider text-white/45">Valor{valor}</label>
          <label className="text-[9px] font-bold uppercase tracking-wider text-white/45">Qtd{qtd}</label>
          <div className="flex flex-col justify-end">
            <span className="text-[9px] font-bold uppercase tracking-wider text-white/45">Custo</span>
            <div className="pt-2">{custoCel}</div>
          </div>
        </div>
        {calcularPerda && aberta && <FaixaPerda ing={ing} onChange={onChange} />}
      </div>
    )
  }

  // ── Desktop: linha em grade ──
  return (
    <div>
      <div className="grid items-center gap-2" style={{ gridTemplateColumns: '1.6fr 1fr .8fr .7fr 1.1fr auto' }}>
        {nome}
        {tipo}
        {valor}
        {qtd}
        {custoCel}
        <div className="flex gap-1.5">{btnPerda}{btnRemover}</div>
      </div>
      {calcularPerda && aberta && <FaixaPerda ing={ing} onChange={onChange} />}
    </div>
  )
}
