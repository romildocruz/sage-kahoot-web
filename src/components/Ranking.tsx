import { formatScore } from '../lib/format'
import type { RankingEntry } from '../realtime/contracts'

const medals = ['🥇', '🥈', '🥉']

export function RankingList({
  entries,
  highlightParticipantId,
  limit,
}: {
  entries: RankingEntry[]
  highlightParticipantId?: string | null
  limit?: number
}) {
  const visible = typeof limit === 'number' ? entries.slice(0, limit) : entries

  if (visible.length === 0) {
    return <p className="muted">Ninguém pontuou ainda.</p>
  }

  return (
    <ol className="ranking" aria-label="Ranking">
      {visible.map((entry) => (
        <li
          key={entry.participantId}
          className={`ranking-row ${entry.participantId === highlightParticipantId ? 'me' : ''}`}
        >
          <span className="position">{entry.position}</span>
          <span>{entry.nickname}</span>
          <span className="score">{formatScore(entry.totalScore)}</span>
        </li>
      ))}
    </ol>
  )
}

/** Pódio da tela final. Ordem visual 2º–1º–3º, como no palco. */
export function Podium({ entries }: { entries: RankingEntry[] }) {
  const [first, second, third] = entries

  if (!first) {
    return <p className="muted center">Nenhum participante pontuou nesta sessão.</p>
  }

  const steps = [
    { entry: second, className: 'second', medal: medals[1] },
    { entry: first, className: 'first', medal: medals[0] },
    { entry: third, className: 'third', medal: medals[2] },
  ].filter((step) => step.entry !== undefined)

  return (
    <div className="podium">
      {steps.map((step) => (
        <div key={step.entry!.participantId} className={`podium-step ${step.className}`}>
          <span className="medal" aria-hidden="true">
            {step.medal}
          </span>
          <span className="nickname">{step.entry!.nickname}</span>
          <span className="muted">{formatScore(step.entry!.totalScore)} pts</span>
        </div>
      ))}
    </div>
  )
}
