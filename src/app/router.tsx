import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminLayout } from '../features/admin/AdminLayout'
import { LoginPage } from '../features/admin/LoginPage'
import { QuizEditorPage } from '../features/admin/QuizEditorPage'
import { QuizListPage } from '../features/admin/QuizListPage'
import { ReportDetailPage } from '../features/admin/ReportDetailPage'
import { ReportsPage } from '../features/admin/ReportsPage'
import { RequireAdmin } from '../features/admin/RequireAdmin'
import { HostSessionPage } from '../features/host/HostSessionPage'
import { JoinPage } from '../features/player/JoinPage'
import { PlayerPage } from '../features/player/PlayerPage'

/**
 * Duas superfícies na mesma aplicação: a raiz é a do participante (é o endereço que vai para o
 * telão) e `/admin` é a do apresentador, atrás da guarda de sessão.
 */
export const router = createBrowserRouter([
  { path: '/', element: <JoinPage /> },
  { path: '/play', element: <PlayerPage /> },
  { path: '/admin/login', element: <LoginPage /> },
  {
    element: <RequireAdmin />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin', element: <QuizListPage /> },
          { path: '/admin/quizzes/new', element: <QuizEditorPage /> },
          { path: '/admin/quizzes/:quizId', element: <QuizEditorPage /> },
          { path: '/admin/reports', element: <ReportsPage /> },
          { path: '/admin/reports/:sessionId', element: <ReportDetailPage /> },
        ],
      },
      // O telão fica fora do AdminLayout: ocupa a tela inteira, sem barra de navegação.
      { path: '/admin/sessions/:sessionId', element: <HostSessionPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
