import { parseSessionStatus, SessionStatus, type SessionStatePayload } from '../../api/types'
import type {
  AnswerCountPayload,
  ParticipantPresencePayload,
  QuestionClosedHostPayload,
  QuestionOpenedPayload,
  RankingEntry,
  RankingPayload,
  SessionStartedPayload,
} from '../../realtime/contracts'

/**
 * Estado da tela do apresentador. Concentrado em um reducer porque a tela é dirigida por eventos do
 * hub — cada evento é uma transição explícita, e a reconexão (`synced`) substitui o estado inteiro
 * pelo que o servidor informa, sem tentar conciliar com o que estava na tela.
 */

export type HostPhase = 'lobby' | 'question' | 'reveal' | 'ended'

export type HostSessionState = {
  phase: HostPhase
  status: SessionStatus
  totalQuestions: number
  participantCount: number
  /** Apelidos vistos entrar nesta conexão — decorativo, para dar vida à sala de espera. */
  recentNicknames: string[]
  currentQuestion: QuestionOpenedPayload | null
  answeredCount: number
  closed: QuestionClosedHostPayload | null
  ranking: RankingEntry[]
  finalRanking: RankingEntry[] | null
}

export const initialHostState: HostSessionState = {
  phase: 'lobby',
  status: SessionStatus.Aguardando,
  totalQuestions: 0,
  participantCount: 0,
  recentNicknames: [],
  currentQuestion: null,
  answeredCount: 0,
  closed: null,
  ranking: [],
  finalRanking: null,
}

export type HostAction =
  | { type: 'synced'; payload: SessionStatePayload }
  | { type: 'participantJoined'; payload: ParticipantPresencePayload }
  | { type: 'participantLeft'; payload: ParticipantPresencePayload }
  | { type: 'sessionStarted'; payload: SessionStartedPayload }
  | { type: 'questionOpened'; payload: QuestionOpenedPayload }
  | { type: 'answerCount'; payload: AnswerCountPayload }
  | { type: 'questionClosed'; payload: QuestionClosedHostPayload }
  | { type: 'ranking'; payload: RankingPayload }
  | { type: 'sessionEnded'; payload: RankingPayload }

export function hostSessionReducer(state: HostSessionState, action: HostAction): HostSessionState {
  switch (action.type) {
    case 'synced': {
      const status = parseSessionStatus(action.payload.status)
      const question = action.payload.currentQuestion

      return {
        ...state,
        status,
        totalQuestions: action.payload.totalQuestions,
        participantCount: action.payload.participantCount,
        currentQuestion: question,
        // Entre perguntas o servidor devolve `currentQuestion: null`; a revelação anterior já não vale.
        closed: question ? state.closed : null,
        answeredCount: question ? state.answeredCount : 0,
        phase:
          status === SessionStatus.Encerrada || status === SessionStatus.Cancelada
            ? 'ended'
            : question
              ? 'question'
              : status === SessionStatus.EmAndamento
                ? 'reveal'
                : 'lobby',
      }
    }

    case 'participantJoined':
      return {
        ...state,
        participantCount: action.payload.totalParticipants,
        recentNicknames: [action.payload.nickname, ...state.recentNicknames].slice(0, 40),
      }

    case 'participantLeft':
      return {
        ...state,
        participantCount: action.payload.totalParticipants,
        recentNicknames: state.recentNicknames.filter((nickname) => nickname !== action.payload.nickname),
      }

    case 'sessionStarted':
      return {
        ...state,
        status: SessionStatus.EmAndamento,
        totalQuestions: action.payload.totalQuestions,
        finalRanking: null,
      }

    case 'questionOpened':
      return {
        ...state,
        status: SessionStatus.EmAndamento,
        phase: 'question',
        currentQuestion: action.payload,
        totalQuestions: action.payload.totalQuestions,
        answeredCount: 0,
        closed: null,
      }

    case 'answerCount':
      // Ignora contagem de uma pergunta que já não é a da tela (evento atrasado após o avanço).
      return state.currentQuestion?.questionId === action.payload.questionId
        ? { ...state, answeredCount: action.payload.answeredCount }
        : state

    case 'questionClosed':
      return { ...state, phase: 'reveal', closed: action.payload }

    case 'ranking':
      return {
        ...state,
        ranking: action.payload.entries,
        // Ranking já consolidado (sessão encerrada): serve de pódio para quem chega ou recarrega
        // a tela depois do encerramento, sem ter recebido o evento de fim de sessão.
        finalRanking: action.payload.isFinal ? action.payload.entries : state.finalRanking,
      }

    case 'sessionEnded':
      return {
        ...state,
        phase: 'ended',
        status: SessionStatus.Encerrada,
        ranking: action.payload.entries,
        finalRanking: action.payload.entries,
        currentQuestion: null,
      }

    default:
      return state
  }
}
