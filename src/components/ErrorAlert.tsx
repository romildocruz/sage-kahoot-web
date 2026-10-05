import { ApiError } from '../api/problem'

/** Renderiza qualquer erro que suba da camada de API em uma mensagem única e legível. */
export function ErrorAlert({ error, className = '' }: { error: unknown; className?: string }) {
  if (!error) return null

  const message =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : 'Falha inesperada. Tente novamente.'

  return (
    <div className={`alert error ${className}`} role="alert">
      {message}
    </div>
  )
}
