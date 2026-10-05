import { publicApi, unwrap } from '../client'
import type { AdminLoginRequest, AdminLoginResult } from '../types'

/** `POST /api/v1/auth/login` — emite o token do apresentador (429 quando há tentativa em excesso). */
export async function login(body: AdminLoginRequest): Promise<AdminLoginResult> {
  return unwrap(await publicApi.POST('/api/v1/auth/login', { body }))
}
