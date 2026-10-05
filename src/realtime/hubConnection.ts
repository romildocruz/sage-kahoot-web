import { HubConnectionBuilder, HubConnectionState, LogLevel, type HubConnection } from '@microsoft/signalr'
import { hubUrl } from '../config/env'
import type { SessionStatePayload } from '../api/types'
import { quizHubMethods } from './contracts'

/**
 * Fábrica da conexão com `/hubs/quiz`.
 *
 * O token vai na query string (`?access_token=`) porque o handshake WebSocket não aceita cabeçalho
 * customizado — a API só aceita esse formato neste caminho. `accessTokenFactory` é chamado a cada
 * (re)conexão, então um token renovado é usado sem recriar a conexão.
 */
export function createQuizHubConnection(accessTokenFactory: () => string): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(hubUrl, { accessTokenFactory })
    // Backoff curto: a sessão é ao vivo e o participante não pode ficar fora por muito tempo.
    .withAutomaticReconnect([0, 1000, 3000, 5000, 10_000, 15_000])
    .configureLogging(import.meta.env.DEV ? LogLevel.Information : LogLevel.Warning)
    .build()
}

/** Entra no grupo da sessão. Obrigatório para o apresentador; validado contra o token do participante. */
export function joinSessionGroup(connection: HubConnection, sessionId: string): Promise<void> {
  return connection.invoke(quizHubMethods.joinSessionGroup, sessionId)
}

/**
 * Estado corrente calculado pelo servidor. Na reconexão o estado local deve ser **substituído** pelo
 * que vier daqui — o relógio do servidor é a única autoridade sobre o tempo restante.
 */
export function syncState(connection: HubConnection, sessionId: string): Promise<SessionStatePayload> {
  return connection.invoke<SessionStatePayload>(quizHubMethods.syncState, sessionId)
}

export { HubConnectionState }
export type { HubConnection }
