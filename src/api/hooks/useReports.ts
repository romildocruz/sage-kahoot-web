import { useMutation, useQuery } from '@tanstack/react-query'
import {
  exportSessionReport,
  getSessionReport,
  listSessions,
  type ExportFormat,
  type ListSessionsParams,
} from '../endpoints/reports'
import { queryKeys } from '../queryKeys'
import { downloadBlob } from '../../lib/download'

export function useSessionsHistory(params: ListSessionsParams = {}) {
  return useQuery({
    queryKey: queryKeys.reports.list(params),
    queryFn: () => listSessions(params),
  })
}

export function useSessionReport(sessionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.reports.detail(sessionId ?? ''),
    queryFn: () => getSessionReport(sessionId as string),
    enabled: Boolean(sessionId),
  })
}

/** Baixa o relatório da sessão no formato pedido. O nome do arquivo usa o PIN para leitura humana. */
export function useExportSessionReport() {
  return useMutation({
    mutationFn: async ({ sessionId, format, pin }: { sessionId: string; format: ExportFormat; pin?: string }) => {
      const blob = await exportSessionReport(sessionId, format)
      downloadBlob(blob, `relatorio-sessao-${pin ?? sessionId}.${format}`)
    },
  })
}
