import { useCallback, useEffect, useRef, useState } from 'react'
import type { HubConnection } from '@microsoft/signalr'
import type { SessionStatePayload } from '../api/types'
import { createQuizHubConnection, HubConnectionState, joinSessionGroup, syncState } from './hubConnection'
import { quizHubEventNames, type QuizHubEvents } from './contracts'

export type HubStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'failed'

export type UseQuizHubOptions = {
  sessionId: string | null
  /** Token de admin (apresentador) ou de participante. Sem token, a conexão não é aberta. */
  token: string | null
  handlers: Partial<QuizHubEvents>
  /** Chamado após conectar e a cada reconexão, com o estado autoritativo do servidor. */
  onSynced?: (state: SessionStatePayload) => void
  onError?: (error: Error) => void
}

export type UseQuizHubResult = {
  status: HubStatus
  error: Error | null
  /** Re-sincroniza sob demanda (ex.: aba volta a ficar visível). */
  resync: () => Promise<SessionStatePayload | null>
}

/**
 * Conecta ao hub, entra no grupo da sessão e distribui os eventos para os handlers informados.
 *
 * Os handlers ficam em ref: a lista de assinaturas é registrada uma única vez por conexão, então
 * recriar as funções a cada render não derruba nem reassina nada.
 */
export function useQuizHub({ sessionId, token, handlers, onSynced, onError }: UseQuizHubOptions): UseQuizHubResult {
  const [status, setStatus] = useState<HubStatus>('idle')
  const [error, setError] = useState<Error | null>(null)

  const connectionRef = useRef<HubConnection | null>(null)
  const handlersRef = useRef(handlers)
  const onSyncedRef = useRef(onSynced)
  const onErrorRef = useRef(onError)
  const tokenRef = useRef(token)

  // Atualizados depois do render (e não durante), para que a assinatura dos eventos, feita uma única
  // vez por conexão, sempre chame a versão mais recente dos callbacks.
  useEffect(() => {
    handlersRef.current = handlers
    onSyncedRef.current = onSynced
    onErrorRef.current = onError
    tokenRef.current = token
  })

  const resync = useCallback(async (): Promise<SessionStatePayload | null> => {
    const connection = connectionRef.current
    if (!sessionId || !connection || connection.state !== HubConnectionState.Connected) {
      return null
    }

    const state = await syncState(connection, sessionId)
    onSyncedRef.current?.(state)
    return state
  }, [sessionId])

  useEffect(() => {
    if (!sessionId || !token) {
      setStatus('idle')
      return
    }

    let disposed = false
    const connection = createQuizHubConnection(() => tokenRef.current ?? '')
    connectionRef.current = connection

    for (const eventName of quizHubEventNames) {
      connection.on(eventName, (payload: never) => {
        const handler = handlersRef.current[eventName] as ((value: never) => void) | undefined
        handler?.(payload)
      })
    }

    connection.onreconnecting((cause) => {
      if (disposed) return
      setStatus('reconnecting')
      if (cause) setError(cause)
    })

    connection.onreconnected(() => {
      if (disposed) return
      setStatus('connected')
      setError(null)
      // Reentra no grupo: a reconexão cria uma connectionId nova, que não herda os grupos anteriores.
      void joinSessionGroup(connection, sessionId)
        .then(() => syncState(connection, sessionId))
        .then((state) => {
          if (!disposed) onSyncedRef.current?.(state)
        })
        .catch(handleFailure)
    })

    connection.onclose((cause) => {
      if (disposed) return
      setStatus('disconnected')
      if (cause) {
        setError(cause)
        onErrorRef.current?.(cause)
      }
    })

    function handleFailure(cause: unknown) {
      if (disposed) return
      const failure = cause instanceof Error ? cause : new Error(String(cause))
      setError(failure)
      setStatus('failed')
      onErrorRef.current?.(failure)
    }

    setStatus('connecting')
    connection
      .start()
      .then(() => joinSessionGroup(connection, sessionId))
      .then(() => syncState(connection, sessionId))
      .then((state) => {
        if (disposed) return
        setStatus('connected')
        setError(null)
        onSyncedRef.current?.(state)
      })
      .catch(handleFailure)

    return () => {
      disposed = true
      connectionRef.current = null
      void connection.stop()
    }
  }, [sessionId, token])

  return { status, error, resync }
}
