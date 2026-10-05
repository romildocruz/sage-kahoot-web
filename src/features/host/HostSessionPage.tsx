import { useCallback, useMemo, useReducer } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAdvanceQuestion, useEndSession, useFetchSessionRanking, useStartSession } from '../../api/hooks/useSessions'
import { useSessionReport } from '../../api/hooks/useReports'
import { SessionStatus, type SessionStatePayload } from '../../api/types'
import { useAdminSession } from '../../auth/useAdminSession'
import { Countdown } from '../../components/Countdown'
import { ErrorAlert } from '../../components/ErrorAlert'
import { HubStatusIndicator } from '../../components/HubStatusIndicator'
import { OptionTile, type OptionTileState } from '../../components/OptionTile'
import { Podium, RankingList } from '../../components/Ranking'
import { formatPin } from '../../lib/format'
import { useCountdown } from '../../lib/useCountdown'
import { joinUrlBase } from '../../config/env'
import type { QuizHubEvents } from '../../realtime/contracts'
import { useQuizHub } from '../../realtime/useQuizHub'
import { hostSessionReducer, initialHostState } from './hostSessionState'

/**
 * Telão do apresentador. Os comandos vão por REST (client tipado) e o que chega de volta vem pelo
 * hub — a tela nunca deduz o estado a partir da resposta do comando, ela espera o evento.
 */
export function HostSessionPage() {
  const { sessionId = null } = useParams<{ sessionId: string }>()
  const { token } = useAdminSession()

  const [state, dispatch] = useReducer(hostSessionReducer, initialHostState)

  // Metadados da sessão (PIN, título, status): sobrevivem a um reload do navegador.
  const meta = useSessionReport(sessionId ?? undefined)

  const start = useStartSession()
  const advance = useAdvanceQuestion()
  const end = useEndSession()
  const fetchRanking = useFetchSessionRanking('admin')

  const handlers = useMemo<Partial<QuizHubEvents>>(
    () => ({
      ParticipantJoined: (payload) => dispatch({ type: 'participantJoined', payload }),
      ParticipantLeft: (payload) => dispatch({ type: 'participantLeft', payload }),
      SessionStarted: (payload) => dispatch({ type: 'sessionStarted', payload }),
      QuestionOpened: (payload) => dispatch({ type: 'questionOpened', payload }),
      AnswerCountChanged: (payload) => dispatch({ type: 'answerCount', payload }),
      QuestionClosed: (payload) => dispatch({ type: 'questionClosed', payload }),
      RankingUpdated: (payload) => dispatch({ type: 'ranking', payload }),
      SessionEnded: (payload) => dispatch({ type: 'sessionEnded', payload }),
    }),
    [],
  )

  // A sincronização traz o estado da pergunta, não as posições: o ranking corrente é buscado à parte
  // para que recarregar o telão entre perguntas — ou depois do fim — não deixe a tela sem ranking.
  const handleSynced = useCallback(
    (payload: SessionStatePayload) => {
      dispatch({ type: 'synced', payload })

      void fetchRanking(payload.sessionId)
        .then((ranking) => dispatch({ type: 'ranking', payload: ranking }))
        // Silencioso de propósito: o ranking é complementar e o próximo RankingUpdated o preenche.
        .catch(() => undefined)
    },
    [fetchRanking],
  )

  const hub = useQuizHub({ sessionId, token, handlers, onSynced: handleSynced })

  const secondsLeft = useCountdown(
    state.phase === 'question' ? (state.currentQuestion?.remainingSeconds ?? null) : null,
    state.currentQuestion?.questionId ?? null,
  )

  const commandError = start.error ?? advance.error ?? end.error
  const busy = start.isPending || advance.isPending || end.isPending
  const question = state.currentQuestion
  const distributionByOption = new Map(state.closed?.distribution.map((it) => [it.optionId, it.count]))

  async function handleEnd() {
    if (!sessionId) return
    if (!window.confirm('Encerrar a sessão agora? O ranking final será consolidado.')) return
    await end.mutateAsync(sessionId)
  }

  function optionState(optionId: string): OptionTileState {
    if (!state.closed) return 'idle'
    return optionId === state.closed.correctOptionId ? 'correct' : 'dimmed'
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="row">
          <Link to="/admin" className="brand" style={{ textDecoration: 'none', color: 'inherit' }}>
            sage<span>kahoot</span>
          </Link>
          <span className="muted">{meta.data?.quizTitle ?? '—'}</span>
        </div>
        <div className="row">
          <HubStatusIndicator status={hub.status} />
          <span className="badge">
            {state.participantCount} participante{state.participantCount === 1 ? '' : 's'}
          </span>
          {state.phase !== 'ended' && (
            <button type="button" className="secondary" onClick={handleEnd} disabled={busy || !sessionId}>
              Encerrar sessão
            </button>
          )}
        </div>
      </header>

      <div className="stage">
        <ErrorAlert error={commandError ?? hub.error ?? meta.error} />

        {state.phase === 'lobby' && (
          <div className="stack center" style={{ alignItems: 'center', marginTop: '2rem' }}>
            <p className="muted">Entre em {joinUrlBase} e informe o PIN</p>
            <div className="pin-display">{meta.data ? formatPin(meta.data.pin) : '······'}</div>

            <div className="participants-bar" style={{ justifyContent: 'center', maxWidth: 900 }}>
              {state.recentNicknames.map((nickname, index) => (
                <span className="chip" key={`${nickname}-${index}`}>
                  {nickname}
                </span>
              ))}
            </div>

            <button
              type="button"
              className="large"
              disabled={busy || state.participantCount === 0 || !sessionId}
              onClick={() => sessionId && start.mutateAsync(sessionId)}
              title={state.participantCount === 0 ? 'Aguardando o primeiro participante' : undefined}
            >
              Iniciar quiz
            </button>
          </div>
        )}

        {(state.phase === 'question' || state.phase === 'reveal') && question && (
          <>
            <div className="row-between">
              <span className="badge">
                Pergunta {question.questionIndex + 1} de {question.totalQuestions}
              </span>
              <span className="badge">
                {state.answeredCount} de {state.participantCount} responderam
              </span>
            </div>

            <div className="row" style={{ justifyContent: 'center', gap: '2rem' }}>
              {state.phase === 'question' && <Countdown secondsLeft={secondsLeft} />}
              <h2 className="question-text grow">{question.text}</h2>
            </div>

            <div className="options-grid">
              {question.options.map((option, index) => (
                <OptionTile
                  key={option.id}
                  index={index}
                  text={option.text}
                  state={optionState(option.id)}
                  count={state.closed ? (distributionByOption.get(option.id) ?? 0) : undefined}
                />
              ))}
            </div>

            <div className="row" style={{ justifyContent: 'center' }}>
              <button
                type="button"
                className="large"
                disabled={busy || !sessionId}
                onClick={() => sessionId && advance.mutateAsync(sessionId)}
              >
                {state.phase === 'question' ? 'Encerrar pergunta' : 'Próxima pergunta'}
              </button>
            </div>

            {state.phase === 'reveal' && state.ranking.length > 0 && (
              <div className="card">
                <h3>Ranking parcial</h3>
                <RankingList entries={state.ranking} limit={5} />
              </div>
            )}
          </>
        )}

        {state.phase === 'reveal' && !question && (
          <div className="stack center">
            <h2>Ranking parcial</h2>
            <RankingList entries={state.ranking} limit={10} />
            <div className="row" style={{ justifyContent: 'center' }}>
              <button
                type="button"
                className="large"
                disabled={busy || !sessionId}
                onClick={() => sessionId && advance.mutateAsync(sessionId)}
              >
                Próxima pergunta
              </button>
            </div>
          </div>
        )}

        {state.phase === 'ended' && (
          <div className="stack center">
            <h2>Resultado final</h2>
            <Podium entries={state.finalRanking ?? state.ranking} />
            <RankingList entries={(state.finalRanking ?? state.ranking).slice(3)} />
            <div className="row" style={{ justifyContent: 'center' }}>
              <Link to={`/admin/reports/${sessionId}`}>
                <button type="button" className="large">
                  Ver relatório da sessão
                </button>
              </Link>
            </div>
          </div>
        )}

        {meta.data?.status === SessionStatus.Cancelada && (
          <div className="alert info">Esta sessão foi cancelada por inatividade.</div>
        )}
      </div>
    </div>
  )
}
