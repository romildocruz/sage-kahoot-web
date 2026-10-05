import type { components } from './generated/schema'

type Schemas = components['schemas']

/**
 * O NSwag gera todas as propriedades de resposta como opcionais (os records C# não declaram
 * `required` no JSON Schema), mas o contrato do servidor garante a presença de tudo que não é
 * explicitamente `nullable`. `Concrete` remove o `?` recursivamente e preserva o `| null` de quem
 * é de fato anulável — evita espalhar `?? 0` / `!` por todas as telas.
 */
export type Concrete<T> = T extends (infer U)[]
  ? Concrete<U>[]
  : T extends object
    ? { [K in keyof T]-?: Concrete<T[K]> }
    : T

// --- Auth -------------------------------------------------------------------
export type AdminLoginRequest = Schemas['SageKahootApiFeaturesAuthLoginLoginRequest']
export type AdminLoginResult = Concrete<Schemas['SageKahootApplicationAuthAdminLoginAdminLoginResult']>

// --- Quizzes ----------------------------------------------------------------
export type QuizDto = Concrete<Schemas['SageKahootApplicationQuizzesQuizDto']>
export type QuestionDto = Concrete<Schemas['SageKahootApplicationQuizzesQuestionDto']>
export type OptionDto = Concrete<Schemas['SageKahootApplicationQuizzesOptionDto']>
export type QuizListItem = Concrete<Schemas['SageKahootApplicationAbstractionsQuizListItem']>
export type CreateQuizRequest = Schemas['SageKahootApiFeaturesQuizzesCreateQuizRequest']
export type UpdateQuizRequest = Schemas['SageKahootApiFeaturesQuizzesUpdateQuizRequest']
export type QuestionRequest = Schemas['SageKahootApiFeaturesQuizzesQuestionRequest']
export type OptionRequest = Schemas['SageKahootApiFeaturesQuizzesOptionRequest']

// --- Sessions ---------------------------------------------------------------
export type SessionDto = Concrete<Schemas['SageKahootApplicationSessionsSessionDto']>
export type JoinSessionRequest = Schemas['SageKahootApiFeaturesSessionsJoinSessionJoinSessionRequest']
export type JoinSessionResult = Concrete<Schemas['SageKahootApplicationSessionsJoinSessionResult']>
export type SubmitAnswerRequest = Schemas['SageKahootApiFeaturesSessionsSubmitAnswerSubmitAnswerRequest']
export type AnswerAcceptedResult = Concrete<Schemas['SageKahootApplicationSessionsAnswerAcceptedResult']>
export type SessionStatePayload = Concrete<Schemas['SageKahootApplicationAbstractionsSessionStatePayload']>
export type RankingPayload = Concrete<Schemas['SageKahootApplicationAbstractionsRankingPayload']>
export type RankingEntry = Concrete<Schemas['SageKahootApplicationAbstractionsRankingEntry']>
export type QuestionOpenedPayload = Concrete<Schemas['SageKahootApplicationAbstractionsQuestionOpenedPayload']>
export type PublicOption = Concrete<Schemas['SageKahootApplicationAbstractionsPublicOption']>

// --- Reports ----------------------------------------------------------------
export type SessionListItem = Concrete<Schemas['SageKahootApplicationAbstractionsSessionListItem']>
export type SessionReport = Concrete<Schemas['SageKahootApplicationReportingSessionReport']>
export type ParticipantReport = Concrete<Schemas['SageKahootApplicationReportingParticipantReport']>
export type QuestionReport = Concrete<Schemas['SageKahootApplicationReportingQuestionReport']>
export type QuestionOptionReport = Concrete<Schemas['SageKahootApplicationReportingQuestionOptionReport']>

// --- Paginação --------------------------------------------------------------
export type PagedResult<TItem> = {
  items: TItem[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

// --- Status da sessão -------------------------------------------------------
/** Enum numérico do domínio (`Sage.Kahoot.Domain.Sessions.SessionStatus`). */
export type SessionStatus = Schemas['SageKahootDomainSessionsSessionStatus']

export const SessionStatus = {
  Aguardando: 0,
  EmAndamento: 1,
  Encerrada: 2,
  Cancelada: 3,
} as const satisfies Record<string, SessionStatus>

export const sessionStatusLabel: Record<SessionStatus, string> = {
  0: 'Aguardando',
  1: 'Em andamento',
  2: 'Encerrada',
  3: 'Cancelada',
}

/**
 * `GET /sessions/{id}/state` e o `SyncState` do hub devolvem o status como string (nome do enum),
 * enquanto `SessionDto` devolve o valor numérico. Normaliza para o numérico.
 */
export function parseSessionStatus(status: string): SessionStatus {
  switch (status) {
    case 'Aguardando':
      return SessionStatus.Aguardando
    case 'EmAndamento':
      return SessionStatus.EmAndamento
    case 'Encerrada':
      return SessionStatus.Encerrada
    case 'Cancelada':
      return SessionStatus.Cancelada
    default:
      return SessionStatus.Aguardando
  }
}
