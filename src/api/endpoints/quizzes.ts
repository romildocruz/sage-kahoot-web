import { adminApi, unwrap } from '../client'
import type { CreateQuizRequest, PagedResult, QuizDto, QuizListItem, UpdateQuizRequest } from '../types'

export type ListQuizzesParams = {
  page?: number
  pageSize?: number
  title?: string | null
}

/** `GET /api/v1/quizzes` — ordenado por atualização decrescente; `pageSize` máximo 100. */
export async function listQuizzes(query: ListQuizzesParams = {}): Promise<PagedResult<QuizListItem>> {
  return unwrap(await adminApi.GET('/api/v1/quizzes', { params: { query } }))
}

/** `GET /api/v1/quizzes/{quizId}` — traz as perguntas com a marcação da opção correta. */
export async function getQuiz(quizId: string): Promise<QuizDto> {
  return unwrap(await adminApi.GET('/api/v1/quizzes/{quizId}', { params: { path: { quizId } } }))
}

export async function createQuiz(body: CreateQuizRequest): Promise<QuizDto> {
  return unwrap(await adminApi.POST('/api/v1/quizzes', { body }))
}

/** `PUT /api/v1/quizzes/{quizId}` — 409 quando existe sessão ativa vinculada ao quiz. */
export async function updateQuiz(quizId: string, body: UpdateQuizRequest): Promise<QuizDto> {
  return unwrap(await adminApi.PUT('/api/v1/quizzes/{quizId}', { params: { path: { quizId } }, body }))
}

export async function duplicateQuiz(quizId: string): Promise<QuizDto> {
  return unwrap(await adminApi.POST('/api/v1/quizzes/{quizId}/duplicate', { params: { path: { quizId } } }))
}

/** `DELETE /api/v1/quizzes/{quizId}` — 204. Relatórios de sessões encerradas continuam válidos. */
export async function deleteQuiz(quizId: string): Promise<void> {
  unwrap(await adminApi.DELETE('/api/v1/quizzes/{quizId}', { params: { path: { quizId } } }))
}
