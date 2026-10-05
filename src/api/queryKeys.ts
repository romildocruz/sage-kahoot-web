import type { ListQuizzesParams } from './endpoints/quizzes'
import type { ListSessionsParams } from './endpoints/reports'

/** Chaves de cache centralizadas: invalidação sempre por prefixo, sem string solta nas telas. */
export const queryKeys = {
  quizzes: {
    root: ['quizzes'] as const,
    list: (params: ListQuizzesParams) => ['quizzes', 'list', params] as const,
    detail: (quizId: string) => ['quizzes', 'detail', quizId] as const,
  },
  sessions: {
    root: ['sessions'] as const,
    state: (sessionId: string) => ['sessions', 'state', sessionId] as const,
    ranking: (sessionId: string) => ['sessions', 'ranking', sessionId] as const,
  },
  reports: {
    root: ['reports'] as const,
    list: (params: ListSessionsParams) => ['reports', 'list', params] as const,
    detail: (sessionId: string) => ['reports', 'detail', sessionId] as const,
  },
} as const
