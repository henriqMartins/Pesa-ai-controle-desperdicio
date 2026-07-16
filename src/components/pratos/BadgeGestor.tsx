// Badge "GESTOR" — mesmo tratamento verde do badge "ativo" da Equipe.
export default function BadgeGestor() {
  return (
    <span
      className="flex-none rounded-full px-3.5 py-1.5 text-[11px] font-extrabold tracking-[.08em]"
      style={{
        color: 'var(--live-green)',
        background: 'rgba(52,211,153,.14)',
        border: '1px solid rgba(52,211,153,.4)',
      }}
    >
      GESTOR
    </span>
  )
}
