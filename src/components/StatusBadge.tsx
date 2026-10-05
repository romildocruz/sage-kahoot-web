import { SessionStatus, sessionStatusLabel } from '../api/types'

const variantByStatus: Record<SessionStatus, string> = {
  [SessionStatus.Aguardando]: 'waiting',
  [SessionStatus.EmAndamento]: 'running',
  [SessionStatus.Encerrada]: 'ended',
  [SessionStatus.Cancelada]: 'cancelled',
}

export function StatusBadge({ status }: { status: SessionStatus }) {
  return <span className={`badge ${variantByStatus[status]}`}>{sessionStatusLabel[status]}</span>
}
