export type PeriodoRapido = 'hoje' | 'semana' | 'mes' | 'personalizado'

export interface Periodo {
  de: string
  ate: string
  label: string
}

function fimDoDia(d: Date): Date {
  const fim = new Date(d)
  fim.setHours(23, 59, 59, 999)
  return fim
}

export function calcularPeriodo(
  rapido: PeriodoRapido,
  customDe?: string,
  customAte?: string,
): Periodo {
  const agora = new Date()

  if (rapido === 'hoje') {
    const inicio = new Date(agora)
    inicio.setHours(0, 0, 0, 0)
    return { de: inicio.toISOString(), ate: fimDoDia(agora).toISOString(), label: 'Hoje' }
  }

  if (rapido === 'semana') {
    const inicio = new Date(agora)
    inicio.setDate(agora.getDate() - 6)
    inicio.setHours(0, 0, 0, 0)
    return {
      de: inicio.toISOString(),
      ate: fimDoDia(agora).toISOString(),
      label: 'Últimos 7 dias',
    }
  }

  if (rapido === 'mes') {
    const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1)
    return {
      de: inicio.toISOString(),
      ate: fimDoDia(agora).toISOString(),
      label: agora.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    }
  }

  // personalizado
  const de = customDe ? new Date(`${customDe}T00:00:00`) : new Date()
  const ate = customAte ? new Date(`${customAte}T23:59:59`) : new Date()
  return {
    de: de.toISOString(),
    ate: ate.toISOString(),
    label: `${de.toLocaleDateString('pt-BR')} – ${ate.toLocaleDateString('pt-BR')}`,
  }
}
