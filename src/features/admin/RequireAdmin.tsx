import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAdminSession } from '../../auth/useAdminSession'

/**
 * Guarda das rotas administrativas. É conveniência de UI, não segurança: quem autoriza de fato é a
 * API, que recusa qualquer rota administrativa sem token de admin válido.
 */
export function RequireAdmin() {
  const { isAuthenticated } = useAdminSession()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
