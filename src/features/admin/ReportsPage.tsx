import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSessionsHistory } from '../../api/hooks/useReports'
import { SessionStatus, sessionStatusLabel } from '../../api/types'
import { ErrorAlert } from '../../components/ErrorAlert'
import { StatusBadge } from '../../components/StatusBadge'
import { formatDateTime, formatPin, formatScore } from '../../lib/format'

const PAGE_SIZE = 20

/** Histórico de sessões para o acompanhamento pós-treinamento. */
export function ReportsPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<SessionStatus | ''>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const sessions = useSessionsHistory({
    page,
    pageSize: PAGE_SIZE,
    status: status === '' ? undefined : status,
    // O filtro é por dia; a API espera date-time, então o dia vira intervalo fechado em UTC.
    from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
    to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
  })

  return (
    <div className="stack">
      <div>
        <h1>Relatórios</h1>
        <p className="muted">Sessões anteriores, da mais recente para a mais antiga.</p>
      </div>

      <form className="row" onSubmit={(event) => event.preventDefault()}>
        <div>
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={status}
            onChange={(event) => {
              setPage(1)
              setStatus(event.target.value === '' ? '' : (Number(event.target.value) as SessionStatus))
            }}
          >
            <option value="">Todos</option>
            {Object.values(SessionStatus).map((value) => (
              <option key={value} value={value}>
                {sessionStatusLabel[value]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="from">De</label>
          <input
            id="from"
            type="date"
            value={from}
            onChange={(event) => {
              setPage(1)
              setFrom(event.target.value)
            }}
          />
        </div>
        <div>
          <label htmlFor="to">Até</label>
          <input
            id="to"
            type="date"
            value={to}
            onChange={(event) => {
              setPage(1)
              setTo(event.target.value)
            }}
          />
        </div>
      </form>

      <ErrorAlert error={sessions.error} />

      <div className="card">
        {sessions.isPending ? (
          <div className="stack">
            <div className="skeleton" />
            <div className="skeleton" />
          </div>
        ) : sessions.data && sessions.data.items.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>PIN</th>
                <th>Quiz</th>
                <th>Status</th>
                <th>Início</th>
                <th>Fim</th>
                <th className="numeric">Participantes</th>
                <th className="numeric">Maior pontuação</th>
              </tr>
            </thead>
            <tbody>
              {sessions.data.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link to={`/admin/reports/${item.id}`}>{formatPin(item.pin)}</Link>
                  </td>
                  <td>{item.quizTitle}</td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td>{formatDateTime(item.startedAtUtc)}</td>
                  <td>{formatDateTime(item.endedAtUtc)}</td>
                  <td className="numeric">{item.participantCount}</td>
                  <td className="numeric">{formatScore(item.topScore)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">Nenhuma sessão no período selecionado.</p>
        )}
      </div>

      {sessions.data && sessions.data.totalPages > 1 && (
        <div className="row-between">
          <span className="muted small">
            Página {sessions.data.page} de {sessions.data.totalPages} · {sessions.data.totalCount} sessões
          </span>
          <div className="row">
            <button type="button" className="secondary" disabled={page <= 1} onClick={() => setPage((it) => it - 1)}>
              Anterior
            </button>
            <button
              type="button"
              className="secondary"
              disabled={page >= sessions.data.totalPages}
              onClick={() => setPage((it) => it + 1)}
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
