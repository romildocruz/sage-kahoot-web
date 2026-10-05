import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAdminSession } from '../../auth/useAdminSession'

/** Casca das telas administrativas: navegação, identificação do papel e saída. */
export function AdminLayout() {
  const { signOut } = useAdminSession()
  const navigate = useNavigate()

  const handleSignOut = () => {
    signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="row">
          <span className="brand">
            sage<span>kahoot</span>
          </span>
          <nav>
            <NavLink to="/admin" end>
              Quizzes
            </NavLink>
            <NavLink to="/admin/reports">Relatórios</NavLink>
          </nav>
        </div>
        <div className="row">
          <span className="muted small">apresentador</span>
          <button type="button" className="secondary" onClick={handleSignOut}>
            Sair
          </button>
        </div>
      </header>

      <main className="container">
        <Outlet />
      </main>
    </div>
  )
}
