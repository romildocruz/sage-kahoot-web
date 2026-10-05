import { adminApi, unwrap } from '../client'
import { toApiError } from '../problem'
import type { PagedResult, SessionListItem, SessionReport, SessionStatus } from '../types'

export type ListSessionsParams = {
  page?: number
  pageSize?: number
  from?: string | null
  to?: string | null
  status?: SessionStatus | null
}

/** `GET /api/v1/reports/sessions` — histórico, da mais recente para a mais antiga. */
export async function listSessions(query: ListSessionsParams = {}): Promise<PagedResult<SessionListItem>> {
  return unwrap(await adminApi.GET('/api/v1/reports/sessions', { params: { query } }))
}

/** `GET /api/v1/reports/sessions/{sessionId}` — ranking com pódio e estatística por pergunta. */
export async function getSessionReport(sessionId: string): Promise<SessionReport> {
  return unwrap(await adminApi.GET('/api/v1/reports/sessions/{sessionId}', { params: { path: { sessionId } } }))
}

export type ExportFormat = 'csv' | 'json'

/**
 * `GET /api/v1/reports/sessions/{id}/export` — o corpo é um arquivo, não JSON; o contrato não declara
 * schema para o 200, então a resposta é lida como blob e entregue ao navegador pelo chamador.
 */
export async function exportSessionReport(sessionId: string, format: ExportFormat): Promise<Blob> {
  const { data, error, response } = await adminApi.GET('/api/v1/reports/sessions/{sessionId}/export', {
    params: { path: { sessionId }, query: { format } },
    parseAs: 'blob',
  })

  if (!response.ok || error !== undefined) {
    throw toApiError(response.status, error)
  }

  return data as unknown as Blob
}
