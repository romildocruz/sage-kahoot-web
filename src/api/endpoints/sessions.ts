import { adminApi, participantApi, publicApi, unwrap } from '../client'
import type {
  AnswerAcceptedResult,
  JoinSessionRequest,
  JoinSessionResult,
  RankingPayload,
  SessionDto,
  SessionStatePayload,
  SubmitAnswerRequest,
} from '../types'

/** `POST /api/v1/sessions` — abre a sessão e devolve o PIN; congela uma cópia do quiz. */
export async function openSession(quizId: string): Promise<SessionDto> {
  return unwrap(await adminApi.POST('/api/v1/sessions', { body: { quizId } }))
}

/** `POST /api/v1/sessions/join` — entrada anônima do participante (429 com rate limit por PIN). */
export async function joinSession(body: JoinSessionRequest): Promise<JoinSessionResult> {
  return unwrap(await publicApi.POST('/api/v1/sessions/join', { body }))
}

export async function startSession(sessionId: string): Promise<SessionDto> {
  return unwrap(await adminApi.POST('/api/v1/sessions/{sessionId}/start', { params: { path: { sessionId } } }))
}

/** `POST /api/v1/sessions/{id}/advance` — fecha a atual, revela a resposta e abre a próxima. */
export async function advanceQuestion(sessionId: string): Promise<SessionDto> {
  return unwrap(await adminApi.POST('/api/v1/sessions/{sessionId}/advance', { params: { path: { sessionId } } }))
}

export async function endSession(sessionId: string): Promise<SessionDto> {
  return unwrap(await adminApi.POST('/api/v1/sessions/{sessionId}/end', { params: { path: { sessionId } } }))
}

/**
 * `GET /api/v1/sessions/{id}/state` — aceita token de admin ou de participante. Serve de fallback
 * quando o hub está indisponível; com o hub conectado, prefira `SyncState`.
 */
export async function getSessionStateAsAdmin(sessionId: string): Promise<SessionStatePayload> {
  return unwrap(await adminApi.GET('/api/v1/sessions/{sessionId}/state', { params: { path: { sessionId } } }))
}

export async function getSessionStateAsParticipant(sessionId: string): Promise<SessionStatePayload> {
  return unwrap(await participantApi.GET('/api/v1/sessions/{sessionId}/state', { params: { path: { sessionId } } }))
}

/**
 * `GET /api/v1/sessions/{id}/ranking` — ranking corrente, `isFinal` quando a sessão já encerrou.
 * Complementa o evento `RankingUpdated`: quem recarrega a tela entre perguntas ficaria sem ranking
 * até o próximo evento, e o estado da sessão traz a pergunta, não as posições.
 */
export async function getSessionRankingAsAdmin(sessionId: string): Promise<RankingPayload> {
  return unwrap(await adminApi.GET('/api/v1/sessions/{sessionId}/ranking', { params: { path: { sessionId } } }))
}

export async function getSessionRankingAsParticipant(sessionId: string): Promise<RankingPayload> {
  return unwrap(await participantApi.GET('/api/v1/sessions/{sessionId}/ranking', { params: { path: { sessionId } } }))
}

/** `POST /api/v1/sessions/{id}/answers` — confirma o recebimento sem revelar acerto. */
export async function submitAnswer(sessionId: string, body: SubmitAnswerRequest): Promise<AnswerAcceptedResult> {
  return unwrap(
    await participantApi.POST('/api/v1/sessions/{sessionId}/answers', { params: { path: { sessionId } }, body }),
  )
}
