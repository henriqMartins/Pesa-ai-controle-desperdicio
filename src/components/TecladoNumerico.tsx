interface Props {
  /** Valor canônico (decimais com ".", ex: "12.5"). */
  value: string
  onChange: (next: string) => void
  /** Permite separador decimal (vírgula). Padrão: true. */
  allowDecimal?: boolean
  /** Máximo de caracteres digitados. */
  maxLength?: number
}

/**
 * Teclado numérico na paleta do sistema — pensado para toque em tablet/celular,
 * evitando o teclado pequeno do SO. Opera sobre uma string canônica (ponto como
 * separador) e exibe vírgula para o usuário brasileiro.
 */
export default function TecladoNumerico({
  value,
  onChange,
  allowDecimal = true,
  maxLength = 9,
}: Props) {
  function digitar(d: string) {
    if (value.replace('.', '').length >= maxLength) return
    // evita zeros à esquerda redundantes ("00", "01")
    if (value === '0' && d !== '.') {
      onChange(d)
      return
    }
    onChange(value + d)
  }

  function ponto() {
    if (!allowDecimal || value.includes('.')) return
    onChange(value === '' ? '0.' : value + '.')
  }

  function apagar() {
    onChange(value.slice(0, -1))
  }

  const teclas = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

  return (
    <div className="grid grid-cols-3 gap-2 select-none">
      {teclas.map((t) => (
        <button key={t} type="button" className="keypad-key" onClick={() => digitar(t)}>
          {t}
        </button>
      ))}

      <button
        type="button"
        className="keypad-key"
        onClick={ponto}
        disabled={!allowDecimal}
        style={!allowDecimal ? { opacity: 0.3, cursor: 'not-allowed' } : undefined}
        aria-label="vírgula"
      >
        ,
      </button>

      <button type="button" className="keypad-key" onClick={() => digitar('0')}>
        0
      </button>

      <button type="button" className="keypad-key" onClick={apagar} aria-label="apagar">
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
  )
}
