import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  advanceQuestion,
  endSession,
  getSessionRankingAsAdmin,
  getSessionRankingAsParticipant,
  openSession,
  startSession,
  submitAnswer,
} from '../endpoints/sessions'
import { queryKeys } from '../queryKeys'
import type { RankingPayload, SubmitAnswerRequest } from '../types'

/**
 * Comandos de sessão. Existem também como invocação do hub, mas vão por REST de propósito: são as
 * chamadas tipadas pelo contrato OpenAPI, com validação e `problem+json` — o hub fica responsável
 * apenas pelos eventos e pelo `SyncState`.
 */

export function useOpenSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (quizId: string) => openSession(quizId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.reports.root }),
  })
}

export function useStartSession() {
  return useMutation({ mutationFn: (sessionId: string) => startSession(sessionId) })
}

export function useAdvanceQuestion() {
  return useMutation({ mutationFn: (sessionId: string) => advanceQuestion(sessionId) })
}

export function useEndSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) => endSession(sessionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.reports.root }),
  })
}

/**
 * Busca do ranking corrente sob demanda, para o momento da sincronização com o servidor.
 *
 * Não é uma consulta contínua: durante a sessão o ranking chega por `RankingUpdated`. Este caminho
 * cobre a lacuna de quem entra ou recarrega a tela entre perguntas — sem ele, a tela fica sem
 * ranking até o próximo evento, e depois do encerramento, sem pódio.
 */
export function useFetchSessionRanking(audience: 'admin' | 'participant') {
  const queryClient = useQueryClient()

  return useCallback(
    (sessionId: string): Promise<RankingPayload> =>
      queryClient.fetchQuery({
        queryKey: queryKeys.sessions.ranking(sessionId),
        queryFn: () =>
          audience === 'admin' ? getSessionRankingAsAdmin(sessionId) : getSessionRankingAsParticipant(sessionId),
        // Sempre do servidor: é chamado justamente quando o estado local pode estar defasado.
        staleTime: 0,
      }),
    [queryClient, audience],
  )
}

export function useSubmitAnswer(sessionId: string | null) {
  return useMutation({
    mutationFn: (body: SubmitAnswerRequest) => submitAnswer(sessionId as string, body),
  })
}
