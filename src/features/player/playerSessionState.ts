import { parseSessionStatus, SessionStatus, type SessionStatePayload } from '../../api/types'
import type {
  QuestionOpenedPayload,
  QuestionResultPayload,
  RankingEntry,
  RankingPayload,
  SessionEndedParticipantPayload,
} from '../../realtime/contracts'

/** Estado da tela do participante — o espelho mínimo do que o servidor mandou para esta pessoa. */

export type PlayerPhase = 'waiting' | 'question' | 'answered' | 'result' | 'ended'

export type PlayerSessionState = {
  phase: PlayerPhase
  status: SessionStatus
  totalQuestions: number
  currentQuestion: QuestionOpenedPayload | null
  /** Opção tocada, para dar retorno imediato antes do `AnswerAccepted`. */
  selectedOptionId: string | null
  answerConfirmed: boolean
  lastResult: QuestionResultPayload | null
  totalScore: number
  ranking: RankingEntry[]
  finalPosition: number | null
}

export const initialPlayerState: PlayerSessionState = {
  phase: 'waiting',
  status: SessionStatus.Aguardando,
  totalQuestions: 0,
  currentQuestion: null,
  selectedOptionId: null,
  answerConfirmed: false,
  lastResult: null,
  totalScore: 0,
  ranking: [],
  finalPosition: null,
}

export type PlayerAction =
  | { type: 'synced'; payload: SessionStatePayload }
  | { type: 'questionOpened'; payload: QuestionOpenedPayload }
  | { type: 'optionSelected'; optionId: string }
  | { type: 'answerFailed' }
  | { type: 'answerAccepted' }
  | { type: 'questionResult'; payload: QuestionResultPayload }
  | { type: 'ranking'; payload: RankingPayload }
  | { type: 'sessionEnded'; payload: SessionEndedParticipantPayload }

export function playerSessionReducer(state: PlayerSessionState, action: PlayerAction): PlayerSessionState {
  switch (action.type) {
    case 'synced': {
      const status = parseSessionStatus(action.payload.status)
      const question = action.payload.currentQuestion

      return {
        ...state,
        status,
        totalQuestions: action.payload.totalQuestions,
        currentQuestion: question,
        totalScore: action.payload.myTotalScore ?? state.totalScore,
        answerConfirmed: action.payload.myAnswerRegistered,
        // Sem a opção escolhida no payload de estado, a marcação visual não é recuperável após um
        // reload — o que importa preservar é o bloqueio de reenvio (`myAnswerRegistered`).
        selectedOptionId: action.payload.myAnswerRegistered ? state.selectedOptionId : null,
        phase:
          status === SessionStatus.Encerrada || status === SessionStatus.Cancelada
            ? 'ended'
            : question
              ? action.payload.myAnswerRegistered
                ? 'answered'
                : 'question'
              : status === SessionStatus.EmAndamento
                ? 'result'
                : 'waiting',
      }
    }

    case 'questionOpened':
      return {
        ...state,
        phase: 'question',
        status: SessionStatus.EmAndamento,
        currentQuestion: action.payload,
        totalQuestions: action.payload.totalQuestions,
        selectedOptionId: null,
        answerConfirmed: false,
        lastResult: null,
      }

    case 'optionSelected':
      return { ...state, phase: 'answered', selectedOptionId: action.optionId }

    // Recusa da API (ex.: pergunta fechada no meio do toque): devolve a escolha ao participante.
    case 'answerFailed':
      return { ...state, phase: 'question', selectedOptionId: null, answerConfirmed: false }

    case 'answerAccepted':
      return { ...state, phase: 'answered', answerConfirmed: true }

    case 'questionResult':
      return {
        ...state,
        phase: 'result',
        lastResult: action.payload,
        totalScore: action.payload.totalScore,
        currentQuestion: null,
      }

    case 'ranking':
      return { ...state, ranking: action.payload.entries }

    case 'sessionEnded':
      return {
        ...state,
        phase: 'ended',
        status: SessionStatus.Encerrada,
        finalPosition: action.payload.position,
        totalScore: action.payload.totalScore,
        currentQuestion: null,
      }

    default:
      return state
  }
}
