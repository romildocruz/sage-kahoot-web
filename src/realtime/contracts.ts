import type { QuestionOpenedPayload, RankingEntry, RankingPayload, SessionStatePayload } from '../api/types'

/**
 * Contrato do hub `/hubs/quiz`. Não sai do OpenAPI — o Swagger não descreve SignalR —, então estes
 * tipos espelham `IQuizClient`/`QuizHub` da sage-kahoot-api
 * (`src/Sage.Kahoot.Api/Hubs/*.cs` e `docs/contrato-hub-signalr.md`).
 *
 * `QuestionOpenedPayload`, `SessionStatePayload` e `RankingPayload` vêm do schema gerado: a API os
 * expõe também em `GET /sessions/{id}/state` e `GET /sessions/{id}/ranking`, então são os mesmos
 * tipos, sem duplicação.
 */

export type { QuestionOpenedPayload, RankingEntry, RankingPayload, SessionStatePayload }

export type ParticipantPresencePayload = {
  sessionId: string
  nickname: string
  totalParticipants: number
}

export type SessionStartedPayload = {
  sessionId: string
  totalQuestions: number
}

export type AnswerCountPayload = {
  sessionId: string
  questionId: string
  answeredCount: number
  activeParticipants: number
}

export type AnswerAcceptedPayload = {
  sessionId: string
  questionId: string
}

export type OptionDistribution = {
  optionId: string
  count: number
}

/** Fechamento na visão do apresentador: é aqui que a opção correta é revelada. */
export type QuestionClosedHostPayload = {
  sessionId: string
  questionId: string
  correctOptionId: string
  distribution: OptionDistribution[]
}

/** Fechamento na visão individual do participante. */
export type QuestionResultPayload = {
  sessionId: string
  questionId: string
  correctOptionId: string
  wasCorrect: boolean
  pointsEarned: number
  totalScore: number
  position: number
}

export type SessionEndedParticipantPayload = {
  sessionId: string
  position: number
  totalScore: number
}

/**
 * Servidor → cliente. Os marcados com `host` só chegam à conexão do apresentador (grupo
 * `session:{id}:host`); os marcados com `participante` chegam ao grupo individual.
 */
export type QuizHubEvents = {
  /** todos */
  ParticipantJoined: (payload: ParticipantPresencePayload) => void
  /** todos */
  ParticipantLeft: (payload: ParticipantPresencePayload) => void
  /** todos */
  SessionStarted: (payload: SessionStartedPayload) => void
  /** todos — nunca carrega a opção correta */
  QuestionOpened: (payload: QuestionOpenedPayload) => void
  /** host */
  AnswerCountChanged: (payload: AnswerCountPayload) => void
  /** participante */
  AnswerAccepted: (payload: AnswerAcceptedPayload) => void
  /** host */
  QuestionClosed: (payload: QuestionClosedHostPayload) => void
  /** participante */
  QuestionResult: (payload: QuestionResultPayload) => void
  /** todos */
  RankingUpdated: (payload: RankingPayload) => void
  /** host — mesmo payload de RankingUpdated, com isFinal: true */
  SessionEnded: (payload: RankingPayload) => void
  /** participante */
  ParticipantSessionEnded: (payload: SessionEndedParticipantPayload) => void
}

export const quizHubEventNames = [
  'ParticipantJoined',
  'ParticipantLeft',
  'SessionStarted',
  'QuestionOpened',
  'AnswerCountChanged',
  'AnswerAccepted',
  'QuestionClosed',
  'QuestionResult',
  'RankingUpdated',
  'SessionEnded',
  'ParticipantSessionEnded',
] as const satisfies readonly (keyof QuizHubEvents)[]

/**
 * Cliente → servidor. Os comandos de controle (`StartSession`, `AdvanceQuestion`, `EndSession`,
 * `SubmitAnswer`) e a consulta de ranking (`GetRanking`) existem também em REST e é por lá que este
 * app os envia — ver `api/endpoints`. Aqui ficam apenas as invocações que só o hub oferece.
 */
export const quizHubMethods = {
  joinSessionGroup: 'JoinSessionGroup',
  syncState: 'SyncState',
} as const
