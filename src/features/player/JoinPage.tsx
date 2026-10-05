import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError } from '../../api/problem'
import { ErrorAlert } from '../../components/ErrorAlert'
import { useParticipantSession } from '../../auth/useParticipantSession'

const PIN_LENGTH = 6
const NICKNAME_MAX_LENGTH = 40

/**
 * Entrada do participante: PIN + apelido, sem conta. O PIN pode vir por link (`/?pin=123456`), que
 * é o que o apresentador projeta junto do código.
 *
 * Nada de dado pessoal aqui: o apelido é livre e o campo avisa para não usar o nome real.
 */
export function JoinPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { join } = useParticipantSession()

  const [pin, setPin] = useState(searchParams.get('pin')?.replace(/\D/g, '').slice(0, PIN_LENGTH) ?? '')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState<unknown>(null)
  const [submitting, setSubmitting] = useState(false)

  const apiError = error instanceof ApiError ? error : null

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await join({ pin, nickname: nickname.trim() })
      navigate('/play', { replace: true })
    } catch (cause) {
      setError(cause)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="player-shell">
      <form className="card join-card" onSubmit={handleSubmit}>
        <h1>
          sage<span style={{ color: 'var(--brand-strong)' }}>kahoot</span>
        </h1>
        <p className="muted">Informe o PIN exibido no telão</p>

        <div className="field">
          <input
            className="pin-input"
            inputMode="numeric"
            autoComplete="off"
            pattern="[0-9]*"
            maxLength={PIN_LENGTH}
            placeholder="000000"
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH))}
            aria-label="PIN da sessão"
            aria-invalid={Boolean(apiError?.errorFor('pin'))}
            required
          />
          {apiError?.errorFor('pin') && <p className="field-error">{apiError.errorFor('pin')}</p>}
        </div>

        <div className="field">
          <input
            placeholder="Seu apelido"
            maxLength={NICKNAME_MAX_LENGTH}
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            aria-label="Apelido"
            aria-invalid={Boolean(apiError?.errorFor('nickname'))}
            required
          />
          {apiError?.errorFor('nickname') && <p className="field-error">{apiError.errorFor('nickname')}</p>}
        </div>

        {apiError && !apiError.fieldErrors.length && <ErrorAlert error={apiError} />}

        <button
          type="submit"
          className="large"
          style={{ width: '100%' }}
          disabled={submitting || pin.length !== PIN_LENGTH || nickname.trim().length === 0}
        >
          {submitting ? <span className="spinner" /> : 'Entrar'}
        </button>

        <p className="muted small" style={{ marginTop: '1rem' }}>
          Use um apelido, não seu nome completo. A sessão é anônima e vale só para este treinamento.
        </p>
      </form>
    </div>
  )
}
