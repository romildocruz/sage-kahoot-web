const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export function formatDateTime(isoUtc: string | null | undefined): string {
  if (!isoUtc) return '—'
  const parsed = new Date(isoUtc)
  return Number.isNaN(parsed.getTime()) ? '—' : dateTimeFormatter.format(parsed)
}

export function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`
}

export function formatSeconds(milliseconds: number): string {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return '—'
  return `${(milliseconds / 1000).toFixed(1)}s`
}

export function formatScore(score: number): string {
  return new Intl.NumberFormat('pt-BR').format(score)
}

/** PIN em blocos de 3 para leitura à distância no telão. */
export function formatPin(pin: string): string {
  return pin.length === 6 ? `${pin.slice(0, 3)} ${pin.slice(3)}` : pin
}
