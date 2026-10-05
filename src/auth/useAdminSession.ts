import { useCallback, useSyncExternalStore } from 'react'
import { login } from '../api/endpoints/auth'
import type { AdminLoginRequest } from '../api/types'
import { adminSessionStore, type AdminSession } from './tokenStore'

/**
 * Sessão do apresentador. O estado vem do store (fonte única), não de um contexto React — assim a
 * camada de API pode ler o token sem depender da árvore de componentes.
 */
export function useAdminSession() {
  const session = useSyncExternalStore<AdminSession | null>(adminSessionStore.subscribe, adminSessionStore.get)

  const signIn = useCallback(async (credentials: AdminLoginRequest) => {
    const result = await login(credentials)
    adminSessionStore.set(result)
    return result
  }, [])

  const signOut = useCallback(() => adminSessionStore.clear(), [])

  return {
    session,
    token: session?.accessToken ?? null,
    isAuthenticated: session !== null,
    signIn,
    signOut,
  }
}
