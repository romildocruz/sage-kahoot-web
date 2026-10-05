import { useCallback, useMemo, useReducer } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useFetchSessionRanking, useSubmitAnswer } from '../../api/hooks/useSessions'
import type { SessionStatePayload } from '../../api/types'
import { useParticipantSession } from '../../auth/useParticipantSession'
import { Countdown } from '../../components/Countdown'
import { ErrorAlert } from '../../components/ErrorAlert'
import { HubStatusIndicator } from '../../components/HubStatusIndicator'
import { OptionTile, type OptionTileState } from '../../components/OptionTile'
import { RankingList } from '../../components/Ranking'
import { formatScore } from '../../lib/format'
import { useCountdown } from '../../lib/useCountdown'
import type { QuizHubEvents } from '../../realtime/contracts'
import { useQuizHub } from '../../realtime/useQuizHub'
import { initialPlayerState, playerSessionReducer } from './playerSessionState'

/**
 * Tela do participante (mobile-first). Só mostra o que o servidor mandou para esta pessoa: a opção
 * correta nunca chega antes do fechamento da pergunta, então não há o que vazar no cliente.
 */
export function PlayerPage() {
  const { session, token, leave } = useParticipantSession()
  const navigate = useNavigate()

  const sessionId = session?.sessionId ?? null
  const [state, dispatch] = useReducer(playerSessionReducer, initialPlayerState)
  const submit = useSubmitAnswer(sessionId)
  const fetchRanking = useFetchSessionRanking('participant')

  const handlers = useMemo<Partial<QuizHubEvents>>(
    () => ({
      QuestionOpened: (payload) => dispatch({ type: 'questionOpened', payload }),
      AnswerAccepted: () => dispatch({ type: 'answerAccepted' }),
      QuestionResult: (payload) => dispatch({ type: 'questionResult', payload }),
      RankingUpdated: (payload) => dispatch({ type: 'ranking', payload }),
      ParticipantSessionEnded: (payload) => dispatch({ type: 'sessionEnded', payload }),
    }),
    [],
  )

  // Mesma razão do telão: quem reconecta entre perguntas ficaria sem ranking até o próximo evento.
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

  const question = state.currentQuestion
  const secondsLeft = useCountdown(
    state.phase === 'question' || state.phase === 'answered' ? (question?.remainingSeconds ?? null) : null,
    question?.questionId ?? null,
  )

  if (!session) {
    return <Navigate to="/" replace />
  }

  async function handleAnswer(optionId: string) {
    if (!question || state.selectedOptionId || state.answerConfirmed) return

    dispatch({ type: 'optionSelected', optionId })

    try {
      await submit.mutateAsync({ questionId: question.questionId, optionId })
      dispatch({ type: 'answerAccepted' })
    } catch {
      // O erro já está em `submit.error`; o estado volta para permitir nova tentativa.
      dispatch({ type: 'answerFailed' })
    }
  }

  function handleLeave() {
    leave()
    navigate('/', { replace: true })
  }

  function optionState(optionId: string): OptionTileState {
    if (state.selectedOptionId === null) return 'idle'
    return state.selectedOptionId === optionId ? 'selected' : 'dimmed'
  }

  return (
    <div className="player-shell">
      <header className="player-header">
        <strong>{session.nickname}</strong>
        <div className="row">
          <span className="badge">{formatScore(state.totalScore)} pts</span>
          <HubStatusIndicator status={hub.status} />
        </div>
      </header>

      <ErrorAlert error={submit.error ?? hub.error} />

      <main className="player-main">
        {state.phase === 'waiting' && (
          <div className="center stack">
            <h2>Você está na sala</h2>
            <p className="muted">{session.quizTitle}</p>
            <p className="muted">Aguarde o apresentador iniciar o quiz.</p>
          </div>
        )}

        {(state.phase === 'question' || state.phase === 'answered') && question && (
          <>
            <div className="row-between">
              <span className="badge">
                Pergunta {question.questionIndex + 1} de {question.totalQuestions}
              </span>
              <Countdown secondsLeft={secondsLeft} />
            </div>

            <h2>{question.text}</h2>

            <div className="options-grid">
              {question.options.map((option, index) => (
                <OptionTile
                  key={option.id}
                  index={index}
                  text={option.text}
                  state={optionState(option.id)}
                  disabled={state.selectedOptionId !== null || state.answerConfirmed || secondsLeft === 0}
                  onSelect={() => handleAnswer(option.id)}
                />
              ))}
            </div>

            {state.answerConfirmed && (
              <p className="center muted">Resposta registrada. Aguarde o fechamento da pergunta.</p>
            )}
          </>
        )}

        {state.phase === 'result' && state.lastResult && (
          <>
            <div className={`big-feedback ${state.lastResult.wasCorrect ? 'correct' : 'wrong'}`}>
              <span className="headline">{state.lastResult.wasCorrect ? 'Acertou!' : 'Não foi dessa vez'}</span>
              <span className="points">+{formatScore(state.lastResult.pointsEarned)}</span>
              <span className="muted">
                {formatScore(state.lastResult.totalScore)} pts · {state.lastResult.position}º lugar
              </span>
            </div>
            {state.ranking.length > 0 && (
              <RankingList entries={state.ranking} limit={5} highlightParticipantId={session.participantId} />
            )}
          </>
        )}

        {state.phase === 'result' && !state.lastResult && (
          <div className="center stack">
            <h2>Pergunta encerrada</h2>
            <p className="muted">Aguarde a próxima pergunta.</p>
          </div>
        )}

        {state.phase === 'ended' && (
          <div className="center stack">
            <h2>Sessão encerrada</h2>
            <div className="big-feedback">
              <span className="headline">{state.finalPosition ? `${state.finalPosition}º lugar` : 'Obrigado!'}</span>
              <span className="points">{formatScore(state.totalScore)}</span>
              <span className="muted">pontos</span>
            </div>
            {state.ranking.length > 0 && (
              <RankingList entries={state.ranking} limit={10} highlightParticipantId={session.participantId} />
            )}
            <button type="button" className="secondary" onClick={handleLeave}>
              Sair
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
