// Teclado de PIN — apresentacional (bolinhas + teclas). Sem lógica de auth: o
// pai controla `pin`, decide o que fazer ao completar e passa `desabilitado`
// (enviando/bloqueado). Compartilhado por TelaPin (login) e LockOverlay (lock).
//
// Não reaproveita o TecladoNumerico de registro: aquele remove zeros à esquerda
// ("01" → "1"), o que corromperia PINs.

interface Props {
  /** Valor atual do PIN (string de dígitos). */
  pin: string
  /** Recebe o PIN já atualizado a cada tecla/apagar. */
  onChange: (next: string) => void
  /** Bloqueia a entrada (durante envio ou lockout). */
  desabilitado?: boolean
  /** Quantidade de dígitos. Padrão 6. */
  tamanho?: number
}

export default function TecladoPin({ pin, onChange, desabilitado = false, tamanho = 6 }: Props) {
  function digitar(d: string) {
    if (desabilitado || pin.length >= tamanho) return
    onChange(pin + d)
  }

  function apagar() {
    if (desabilitado) return
    onChange(pin.slice(0, -1))
  }

  const teclas = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

  return (
    <div>
      {/* Display (bolinhas) */}
      <div className="mb-5 flex justify-center gap-3" aria-label="dígitos do PIN">
        {Array.from({ length: tamanho }).map((_, i) => {
          const preenchido = i < pin.length
          return (
            <span
              key={i}
              className="h-3.5 w-3.5 rounded-full transition-colors"
              style={{
                background: preenchido ? 'var(--orange)' : 'transparent',
                border: `1.5px solid ${preenchido ? 'var(--orange)' : 'var(--bd-20)'}`,
              }}
            />
          )
        })}
      </div>

      {/* Teclado */}
      <div className="grid grid-cols-3 gap-2 select-none">
        {teclas.map((t) => (
          <button key={t} type="button" className="keypad-key" onClick={() => digitar(t)} disabled={desabilitado}>
            {t}
          </button>
        ))}
        <span aria-hidden /> {/* célula vazia à esquerda do zero */}
        <button type="button" className="keypad-key" onClick={() => digitar('0')} disabled={desabilitado}>
          0
        </button>
        <button type="button" className="keypad-key" onClick={apagar} disabled={desabilitado} aria-label="apagar">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ margin: '0 auto', color: 'var(--orange)' }}
          >
            <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
            <line x1="18" y1="9" x2="12" y2="15" />
            <line x1="12" y1="9" x2="18" y2="15" />
          </svg>
        </button>
      </div>
    </div>
  )
}
