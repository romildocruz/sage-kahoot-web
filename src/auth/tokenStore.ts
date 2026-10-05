import type { AdminLoginResult, JoinSessionResult } from '../api/types'

/**
 * Guarda os dois tokens que o app manipula, com escopos de armazenamento diferentes de propósito:
 *
 * - **Admin** (`localStorage`): o apresentador prepara o treinamento em várias visitas; sobreviver a
 *   um reload é o comportamento esperado.
 * - **Participante** (`sessionStorage`): amarrado à aba e à sessão de treinamento; não deve vazar
 *   para outra aba nem persistir depois do fim do treinamento.
 *
 * Risco conhecido: token em storage do navegador é legível por XSS. Aceitável aqui (app interno, sem
 * exposição pública, token de curta duração), mas é o motivo de nunca guardarmos nada além do token.
 */

const ADMIN_KEY = 'sk.admin.session'
const PARTICIPANT_KEY = 'sk.participant.session'

export type AdminSession = AdminLoginResult

export type ParticipantSession = JoinSessionResult

type Listener = () => void

function read<T>(storage: Storage, key: string): T | null {
  try {
    const raw = storage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function createStore<T extends { expiresAtUtc: string }>(storage: Storage, key: string) {
  const listeners = new Set<Listener>()
  let cache: T | null = read<T>(storage, key)

  const isExpired = (value: T): boolean => new Date(value.expiresAtUtc).getTime() <= Date.now()

  const notify = () => listeners.forEach((listener) => listener())

  return {
    get(): T | null {
      if (cache && isExpired(cache)) {
        cache = null
        storage.removeItem(key)
      }
      return cache
    },
    set(value: T): void {
      cache = value
      storage.setItem(key, JSON.stringify(value))
      notify()
    },
    clear(): void {
      cache = null
      storage.removeItem(key)
      notify()
    },
    subscribe(listener: Listener): () => void {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

export const adminSessionStore = createStore<AdminSession>(localStorage, ADMIN_KEY)

export const participantSessionStore = createStore<ParticipantSession>(sessionStorage, PARTICIPANT_KEY)

export const getAdminToken = (): string | null => adminSessionStore.get()?.accessToken ?? null

export const getParticipantToken = (): string | null => participantSessionStore.get()?.accessToken ?? null
