import { Component, type ErrorInfo, type ReactNode } from 'react'

// Boundary global de erro de render. Sem ele, um erro de JavaScript deixa a
// tela BRANCA para a dona/equipe, sem saída nem pista. Aqui mostramos uma tela
// amigável com botão de recarregar. Error boundaries precisam ser classe — não
// há equivalente em hook.

interface Props {
  children: ReactNode
}
interface State {
  erro: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { erro: false }

  static getDerivedStateFromError(): State {
    return { erro: true }
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    // Log para diagnóstico. Futuro: enviar a um serviço (ex.: Sentry).
    console.error('Erro não tratado na UI:', erro, info)
  }

  render() {
    if (!this.state.erro) return this.props.children
    return (
      <div className="flex min-h-full items-center justify-center bg-app px-6 text-center">
        <div className="max-w-xs">
          <div
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: 'var(--accent-grad)', boxShadow: '0 8px 24px rgba(240,70,78,.4)' }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h1 className="text-lg font-extrabold" style={{ color: 'var(--tx)' }}>
            Algo deu errado
          </h1>
          <p className="mt-2 text-sm text-white/55">
            Tente recarregar a página. Se o problema continuar, feche e abra o app de novo.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-accent mt-5 w-full rounded-xl py-3 text-sm font-extrabold"
          >
            Recarregar
          </button>
        </div>
      </div>
    )
  }
}
