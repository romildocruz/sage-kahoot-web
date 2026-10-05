import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createQuiz,
  deleteQuiz,
  duplicateQuiz,
  getQuiz,
  listQuizzes,
  updateQuiz,
  type ListQuizzesParams,
} from '../endpoints/quizzes'
import { queryKeys } from '../queryKeys'
import type { CreateQuizRequest, UpdateQuizRequest } from '../types'

export function useQuizzes(params: ListQuizzesParams = {}) {
  return useQuery({
    queryKey: queryKeys.quizzes.list(params),
    queryFn: () => listQuizzes(params),
  })
}

export function useQuiz(quizId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.quizzes.detail(quizId ?? ''),
    queryFn: () => getQuiz(quizId as string),
    enabled: Boolean(quizId),
  })
}

export function useCreateQuiz() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CreateQuizRequest) => createQuiz(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.root }),
  })
}

export function useUpdateQuiz() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ quizId, body }: { quizId: string; body: UpdateQuizRequest }) => updateQuiz(quizId, body),
    onSuccess: (quiz) => {
      queryClient.setQueryData(queryKeys.quizzes.detail(quiz.id), quiz)
      return queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.root })
    },
  })
}

export function useDuplicateQuiz() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (quizId: string) => duplicateQuiz(quizId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.root }),
  })
}

export function useDeleteQuiz() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (quizId: string) => deleteQuiz(quizId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.root }),
  })
}
