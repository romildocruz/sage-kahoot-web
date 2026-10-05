import { Link, useParams } from 'react-router-dom'
import { useExportSessionReport, useSessionReport } from '../../api/hooks/useReports'
import { ErrorAlert } from '../../components/ErrorAlert'
import { Podium } from '../../components/Ranking'
import { StatusBadge } from '../../components/StatusBadge'
import { formatDateTime, formatPercent, formatPin, formatScore, formatSeconds } from '../../lib/format'
import { optionColor, optionMarker } from '../../lib/optionStyle'

/** Relatório da sessão: pódio, ranking completo e desempenho pergunta a pergunta. */
export function ReportDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const report = useSessionReport(sessionId)
  const exportReport = useExportSessionReport()

  if (report.isPending) {
    return <div className="card skeleton" style={{ height: '10rem' }} />
  }

  if (report.error || !report.data) {
    return <ErrorAlert error={report.error} />
  }

  const data = report.data
  const podium = data.ranking.filter((entry) => entry.isPodium)

  return (
    <div className="stack">
      <div className="row-between">
        <div>
          <Link to="/admin/reports" className="small">
            ← Relatórios
          </Link>
          <h1>{data.quizTitle}</h1>
          <div className="row">
            <span className="badge">PIN {formatPin(data.pin)}</span>
            <StatusBadge status={data.status} />
            {!data.isFinal && <span className="badge waiting">Parcial</span>}
          </div>
        </div>
        <div className="row">
          <button
            type="button"
            className="secondary"
            disabled={exportReport.isPending}
            onClick={() => exportReport.mutate({ sessionId: data.sessionId, format: 'csv', pin: data.pin })}
          >
            Exportar CSV
          </button>
          <button
            type="button"
            className="secondary"
            disabled={exportReport.isPending}
            onClick={() => exportReport.mutate({ sessionId: data.sessionId, format: 'json', pin: data.pin })}
          >
            Exportar JSON
          </button>
        </div>
      </div>

      <ErrorAlert error={exportReport.error} />

      <div className="card row" style={{ gap: '2.5rem' }}>
        <div>
          <div className="muted small">Início</div>
          <strong>{formatDateTime(data.startedAtUtc)}</strong>
        </div>
        <div>
          <div className="muted small">Fim</div>
          <strong>{formatDateTime(data.endedAtUtc)}</strong>
        </div>
        <div>
          <div className="muted small">Participantes</div>
          <strong>{data.participantCount}</strong>
        </div>
        <div>
          <div className="muted small">Perguntas</div>
          <strong>{data.questions.length}</strong>
        </div>
      </div>

      {podium.length > 0 && (
        <div className="card">
          <h3>Pódio</h3>
          <Podium
            entries={podium.map((entry) => ({
              position: entry.position,
              participantId: entry.participantId,
              nickname: entry.nickname,
              totalScore: entry.totalScore,
            }))}
          />
        </div>
      )}

      <div className="card">
        <h3>Ranking</h3>
        <table className="table">
          <thead>
            <tr>
              <th className="numeric">#</th>
              <th>Apelido</th>
              <th className="numeric">Pontos</th>
              <th className="numeric">Acertos</th>
              <th className="numeric">Erros</th>
              <th className="numeric">Sem resposta</th>
              <th className="numeric">Tempo médio</th>
            </tr>
          </thead>
          <tbody>
            {data.ranking.map((entry) => (
              <tr key={entry.participantId}>
                <td className="numeric">{entry.position}</td>
                <td>{entry.nickname}</td>
                <td className="numeric">{formatScore(entry.totalScore)}</td>
                <td className="numeric">{entry.correctCount}</td>
                <td className="numeric">{entry.wrongCount}</td>
                <td className="numeric">{entry.unansweredCount}</td>
                <td className="numeric">{formatSeconds(entry.averageResponseTimeMs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Desempenho por pergunta</h3>
        <div className="stack">
          {data.questions
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((question) => (
              <div key={question.questionId}>
                <div className="row-between">
                  <strong>
                    {question.order + 1}. {question.text}
                  </strong>
                  <span className="row small muted">
                    <span>Taxa de acerto: {formatPercent(question.correctRate)}</span>
                    <span>Tempo médio: {formatSeconds(question.averageResponseTimeMs)}</span>
                    <span>Sem resposta: {question.unansweredCount}</span>
                  </span>
                </div>

                <table className="table">
                  <tbody>
                    {question.options.map((option, index) => {
                      const share = question.answerCount > 0 ? option.answerCount / question.answerCount : 0
                      return (
                        <tr key={option.optionId}>
                          <td style={{ width: '2.5rem' }}>
                            <span
                              aria-hidden="true"
                              style={{
                                display: 'grid',
                                placeItems: 'center',
                                width: '1.75rem',
                                height: '1.75rem',
                                borderRadius: 6,
                                background: optionColor(index),
                                fontWeight: 700,
                              }}
                            >
                              {optionMarker(index)}
                            </span>
                          </td>
                          <td>
                            {option.text}
                            {option.isCorrect && <span className="badge running" style={{ marginLeft: '0.5rem' }}>correta</span>}
                          </td>
                          <td className="numeric" style={{ width: '9rem' }}>
                            {option.answerCount} ({formatPercent(share)})
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
