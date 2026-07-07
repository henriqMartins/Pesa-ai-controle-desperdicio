/**
 * Utilidades de data/hora ancoradas no fuso de **São Paulo**.
 *
 * Por quê: o app roda no tablet da petiscaria. Se o aparelho estiver com o fuso
 * (ou o relógio) errado, "hoje" e "este mês" sairiam furados — e os números do
 * Monitor são o produto. O banco grava em UTC (`now()`), então centralizamos
 * aqui toda conversão para o horário do negócio, em vez de confiar no fuso local
 * do dispositivo.
 *
 * Implementação sem dependências: usa `Intl.DateTimeFormat` com `timeZone` para
 * descobrir a "parede-relógio" de SP e o deslocamento (offset) em qualquer
 * instante — então funciona mesmo que o Brasil volte a adotar horário de verão.
 */

export const FUSO = 'America/Sao_Paulo'

interface PartesData {
  ano: number
  mes0: number // mês 0–11 (como em Date)
  dia: number
  hora: number
  min: number
  seg: number
}

/** Decompõe um instante nas partes de data/hora vistas no fuso de SP. */
function partesEmSP(instante: Date): PartesData {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: FUSO,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const p: Record<string, string> = {}
  for (const part of dtf.formatToParts(instante)) {
    if (part.type !== 'literal') p[part.type] = part.value
  }
  return {
    ano: +p.year,
    mes0: +p.month - 1,
    dia: +p.day,
    hora: +p.hour % 24, // '24' à meia-noite em alguns ambientes → vira 0
    min: +p.minute,
    seg: +p.second,
  }
}

/** Deslocamento do fuso de SP em relação ao UTC, em minutos (SP = -180). */
function offsetMinutos(instante: Date): number {
  const p = partesEmSP(instante)
  const comoUTC = Date.UTC(p.ano, p.mes0, p.dia, p.hora, p.min, p.seg)
  return (comoUTC - instante.getTime()) / 60000
}

/** Converte uma parede-relógio de SP no instante (UTC) correspondente. */
function instanteDeSP(ano: number, mes0: number, dia: number): Date {
  const palpite = Date.UTC(ano, mes0, dia)
  const off = offsetMinutos(new Date(palpite))
  return new Date(palpite - off * 60000)
}

/** Instante da meia-noite de hoje no fuso de SP. */
export function inicioDoDiaSP(agora: Date = new Date()): Date {
  const { ano, mes0, dia } = partesEmSP(agora)
  return instanteDeSP(ano, mes0, dia)
}

/** Instante da meia-noite do dia 1 do mês corrente, no fuso de SP. */
export function inicioDoMesSP(agora: Date = new Date()): Date {
  const { ano, mes0 } = partesEmSP(agora)
  return instanteDeSP(ano, mes0, 1)
}

/** Dia do mês (1–31) de hoje no fuso de SP. */
export function diaDoMesSP(agora: Date = new Date()): number {
  return partesEmSP(agora).dia
}

/** Quantos dias tem o mês corrente, no fuso de SP. */
export function diasNoMesSP(agora: Date = new Date()): number {
  const { ano, mes0 } = partesEmSP(agora)
  // Dia 0 do próximo mês = último dia deste mês. A contagem de dias do mês não
  // depende do fuso, então o construtor local serve aqui.
  return new Date(ano, mes0 + 1, 0).getDate()
}

/** Chave de dia 'AAAA-MM-DD' de um instante no fuso de SP (para comparar dias). */
export function diaEmSP(instante: Date = new Date()): string {
  const { ano, mes0, dia } = partesEmSP(instante)
  return `${ano}-${String(mes0 + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

/** Meia-noite (SP) de uma data 'AAAA-MM-DD' — início inclusivo do dia. */
export function inicioDoDiaSPDeString(data: string): Date {
  const [ano, mes, dia] = data.split('-').map(Number)
  return instanteDeSP(ano, mes - 1, dia)
}

/**
 * Meia-noite (SP) do dia **seguinte** a uma data 'AAAA-MM-DD' — fim exclusivo do
 * dia. Usar como limite superior em intervalos "até" inclusivos (`ts < fim`).
 * `Date.UTC` normaliza o estouro de `dia + 1` (ex.: 31 → dia 1 do próximo mês).
 */
export function fimDoDiaSPDeString(data: string): Date {
  const [ano, mes, dia] = data.split('-').map(Number)
  return instanteDeSP(ano, mes - 1, dia + 1)
}
