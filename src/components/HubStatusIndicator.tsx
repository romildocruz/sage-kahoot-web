import type { HubStatus } from '../realtime/useQuizHub'

const label: Record<HubStatus, string> = {
  idle: 'Tempo real inativo',
  connecting: 'Conectando…',
  connected: 'Tempo real conectado',
  reconnecting: 'Reconectando…',
  disconnected: 'Desconectado',
  failed: 'Falha na conexão',
}

/**
 * Estado da conexão com o hub. Fica sempre visível: se o tempo real cair no meio da sessão, o
 * apresentador precisa saber antes de concluir que "ninguém está respondendo".
 */
export function HubStatusIndicator({ status }: { status: HubStatus }) {
  return (
    <span className={`hub-status ${status}`} role="status" aria-live="polite">
      <span className="dot" aria-hidden="true" />
      {label[status]}
    </span>
  )
}
