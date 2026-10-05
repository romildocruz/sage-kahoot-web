import createClient, { type Middleware } from 'openapi-fetch'
import { apiBaseUrl } from '../config/env'
import { adminSessionStore, getAdminToken, getParticipantToken, participantSessionStore } from '../auth/tokenStore'
import type { paths } from './generated/schema'
import { ApiError, toApiError, toNetworkError } from './problem'
import type { Concrete } from './types'

/**
 * Clientes HTTP tipados pelo `openapi.json` da sage-kahoot-api. São três porque o contrato tem três
 * públicos distintos (D6 da API): rotas abertas, rotas de apresentador e rotas de participante —
 * cada token vai exatamente para onde vale, sem middleware adivinhando pelo caminho da URL.
 *
 * Nenhum componente deve chamar `fetch` direto: as telas consomem os hooks de `api/hooks`.
 */

/** Traduz falha de transporte em `ApiError` antes de sair da camada de API. */
const resilientFetch: typeof fetch = async (input, init) => {
  try {
    return await fetch(input, init)
  } catch (cause) {
    throw toNetworkError(cause)
  }
}

const baseOptions = { baseUrl: apiBaseUrl || '/', fetch: resilientFetch }

function bearerMiddleware(getToken: () => string | null, onUnauthorized?: () => void): Middleware {
  return {
    onRequest({ request }) {
      const token = getToken()
      if (token) {
        request.headers.set('Authorization', `Bearer ${token}`)
      }
      return request
    },
    onResponse({ response }) {
      // Token expirado ou revogado: descarta o que está guardado para a UI cair no fluxo de entrada.
      if (response.status === 401) {
        onUnauthorized?.()
      }
      return response
    },
  }
}

/** Rotas sem autenticação: `POST /auth/login` e `POST /sessions/join`. */
export const publicApi = createClient<paths>(baseOptions)

/** Rotas administrativas (quizzes, controle de sessão, relatórios). */
export const adminApi = createClient<paths>(baseOptions)
adminApi.use(bearerMiddleware(getAdminToken, () => adminSessionStore.clear()))

/** Rotas do participante (`/sessions/{id}/answers`, `/sessions/{id}/state`). */
export const participantApi = createClient<paths>(baseOptions)
participantApi.use(bearerMiddleware(getParticipantToken, () => participantSessionStore.clear()))

type FetchResult<T> = { data?: T; error?: unknown; response: Response }

/**
 * Converte o resultado do openapi-fetch em valor ou exceção. Mantém as chamadas das telas legíveis
 * (`await listQuizzes()`) e garante que todo erro que sobe é um `ApiError`.
 *
 * O retorno é `Concrete<T>` porque o NSwag marca toda propriedade de resposta como opcional; ver a
 * explicação em `api/types.ts`. A garantia de que o tipo bate com a rota continua vindo do
 * openapi-fetch, que infere `T` a partir do caminho chamado.
 */
export function unwrap<T>(result: FetchResult<T>): Concrete<T> {
  if (result.response.ok && result.error === undefined) {
    return result.data as Concrete<T>
  }

  throw toApiError(result.response.status, result.error)
}

export { ApiError }
