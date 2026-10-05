/** Círculo de contagem regressiva. Fica vermelho nos últimos 5 segundos. */
export function Countdown({ secondsLeft }: { secondsLeft: number }) {
  return (
    <div className={`countdown ${secondsLeft <= 5 ? 'urgent' : ''}`} role="timer" aria-live="off">
      {secondsLeft}
    </div>
  )
}
