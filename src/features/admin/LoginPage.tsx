import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/problem'
import { ErrorAlert } from '../../components/ErrorAlert'
import { useAdminSession } from '../../auth/useAdminSession'

type LocationState = { from?: string } | null

/**
 * Login do apresentador. Credencial única, configurada por Secret na API — este formulário só a
 * troca por um token de curta duração; nada é validado no cliente além de campo vazio.
 */
export function LoginPage() {
  const { signIn } = useAdminSession()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<unknown>(null)
  const [submitting, setSubmitting] = useState(false)

  const apiError = error instanceof ApiError ? error : null

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await signIn({ username, password })
      const destination = (location.state as LocationState)?.from ?? '/admin'
      navigate(destination, { replace: true })
    } catch (cause) {
      setError(cause)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="container" style={{ display: 'grid', placeItems: 'center', flex: 1 }}>
        <form className="card join-card" onSubmit={handleSubmit}>
          <h1>
            sage<span style={{ color: 'var(--brand-strong)' }}>kahoot</span>
          </h1>
          <p className="muted">Acesso do apresentador</p>

          <div className="field" style={{ textAlign: 'left' }}>
            <label htmlFor="username">Usuário</label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              aria-invalid={Boolean(apiError?.errorFor('username'))}
              required
            />
            {apiError?.errorFor('username') && <p className="field-error">{apiError.errorFor('username')}</p>}
          </div>

          <div className="field" style={{ textAlign: 'left' }}>
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(apiError?.errorFor('password'))}
              required
            />
            {apiError?.errorFor('password') && <p className="field-error">{apiError.errorFor('password')}</p>}
          </div>

          {apiError && !apiError.fieldErrors.length && <ErrorAlert error={apiError} />}

          <button type="submit" className="large" disabled={submitting} style={{ width: '100%', marginTop: '0.5rem' }}>
            {submitting ? <span className="spinner" /> : 'Entrar'}
          </button>

          <p className="muted small" style={{ marginTop: '1rem' }}>
            Participante? Use a <a href="/">tela de entrada por PIN</a>.
          </p>
        </form>
      </div>
    </div>
  )
}
