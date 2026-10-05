import { useCallback, useSyncExternalStore } from 'react'
import { joinSession } from '../api/endpoints/sessions'
import type { JoinSessionRequest } from '../api/types'
import { participantSessionStore, type ParticipantSession } from './tokenStore'

/** Sessão anônima do participante: PIN + apelido, sem conta. Vive na aba (`sessionStorage`). */
export function useParticipantSession() {
  const session = useSyncExternalStore<ParticipantSession | null>(
    participantSessionStore.subscribe,
    participantSessionStore.get,
  )

  const join = useCallback(async (request: JoinSessionRequest) => {
    const result = await joinSession(request)
    participantSessionStore.set(result)
    return result
  }, [])

  const leave = useCallback(() => participantSessionStore.clear(), [])

  return {
    session,
    token: session?.accessToken ?? null,
    isJoined: session !== null,
    join,
    leave,
  }
}
