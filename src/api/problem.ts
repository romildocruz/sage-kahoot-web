import type { components } from './generated/schema'

type ValidationProblem = components['schemas']['FastEndpointsProblemDetails']
type Problem = components['schemas']['MicrosoftAspNetCoreMvcProblemDetails']

export type FieldError = { name: string; reason: string }

/**
 * Erro único da camada de API. A API responde `application/problem+json` (RFC 7807/9457) tanto para
 * falha de validação do FastEndpoints quanto para recusa de regra de negócio — os dois viram isto.
 */
export class ApiError extends Error {
  readonly status: number
  readonly title?: string
  readonly detail?: string
  readonly fieldErrors: FieldError[]

  constructor(status: number, message: string, options: { title?: string; detail?: string; fieldErrors?: FieldError[] } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.title = options.title
    this.detail = options.detail
    this.fieldErrors = options.fieldErrors ?? []
  }

  /** Erro por campo, no formato consumido pelos formulários. */
  errorFor(field: string): string | undefined {
    const match = this.fieldErrors.find((error) => error.name.toLowerCase() === field.toLowerCase())
    return match?.reason
  }

  get isUnauthorized(): boolean {
    return this.status === 401 || this.status === 403
  }

  get isConflict(): boolean {
    return this.status === 409
  }

  get isRateLimited(): boolean {
    return this.status === 429
  }
}

const statusFallback: Record<number, string> = {
  400: 'Dados inválidos.',
  401: 'Sessão expirada ou credencial inválida.',
  403: 'Você não tem permissão para esta ação.',
  404: 'Recurso não encontrado.',
  409: 'A operação conflita com o estado atual.',
  429: 'Muitas tentativas. Aguarde alguns instantes.',
}

function isValidationProblem(payload: unknown): payload is ValidationProblem {
  return typeof payload === 'object' && payload !== null && Array.isArray((payload as ValidationProblem).errors)
}

/** Converte o corpo `problem+json` (ou qualquer outro) em `ApiError`. */
export function toApiError(status: number, payload: unknown): ApiError {
  if (isValidationProblem(payload)) {
    const fieldErrors = (payload.errors ?? []).map((error) => ({ name: error.name, reason: error.reason }))
    const message = fieldErrors[0]?.reason ?? payload.detail ?? payload.title ?? statusFallback[status]
    return new ApiError(status, message ?? 'Falha na requisição.', {
      title: payload.title,
      detail: payload.detail ?? undefined,
      fieldErrors,
    })
  }

  const problem = (payload ?? {}) as Problem
  const message = problem.detail ?? problem.title ?? statusFallback[status] ?? 'Falha na requisição.'

  return new ApiError(status, message, { title: problem.title ?? undefined, detail: problem.detail ?? undefined })
}

/** Falha de transporte (API fora do ar, DNS, CORS). */
export function toNetworkError(cause: unknown): ApiError {
  return new ApiError(0, 'Não foi possível falar com a API. Verifique a conexão com a rede interna.', {
    detail: cause instanceof Error ? cause.message : undefined,
  })
}
