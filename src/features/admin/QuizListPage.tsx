import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDeleteQuiz, useDuplicateQuiz, useQuizzes } from '../../api/hooks/useQuizzes'
import { useOpenSession } from '../../api/hooks/useSessions'
import { ErrorAlert } from '../../components/ErrorAlert'
import { formatDateTime } from '../../lib/format'

const PAGE_SIZE = 20

/** Banco de quizzes: CRUD e o ponto de partida da sessão ao vivo. */
export function QuizListPage() {
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [titleFilter, setTitleFilter] = useState('')
  const [search, setSearch] = useState('')

  const quizzes = useQuizzes({ page, pageSize: PAGE_SIZE, title: search || undefined })
  const duplicate = useDuplicateQuiz()
  const remove = useDeleteQuiz()
  const openSession = useOpenSession()

  const actionError = duplicate.error ?? remove.error ?? openSession.error

  async function handleOpenSession(quizId: string) {
    const session = await openSession.mutateAsync(quizId)
    navigate(`/admin/sessions/${session.id}`)
  }

  async function handleDelete(quizId: string, title: string) {
    if (!window.confirm(`Excluir o quiz "${title}"? Relatórios de sessões encerradas continuam disponíveis.`)) {
      return
    }
    await remove.mutateAsync(quizId)
  }

  return (
    <div className="stack">
      <div className="row-between">
        <div>
          <h1>Quizzes</h1>
          <p className="muted">Banco de perguntas reutilizável para os treinamentos.</p>
        </div>
        <Link to="/admin/quizzes/new">
          <button type="button">Novo quiz</button>
        </Link>
      </div>

      <form
        className="row"
        onSubmit={(event) => {
          event.preventDefault()
          setPage(1)
          setSearch(titleFilter.trim())
        }}
      >
        <input
          className="grow"
          placeholder="Filtrar por título"
          value={titleFilter}
          onChange={(event) => setTitleFilter(event.target.value)}
          aria-label="Filtrar por título"
        />
        <button type="submit" className="secondary">
          Filtrar
        </button>
      </form>

      <ErrorAlert error={quizzes.error ?? actionError} />

      <div className="card">
        {quizzes.isPending ? (
          <div className="stack">
            <div className="skeleton" />
            <div className="skeleton" />
            <div className="skeleton" />
          </div>
        ) : quizzes.data && quizzes.data.items.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Título</th>
                <th className="numeric">Perguntas</th>
                <th>Atualizado em</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {quizzes.data.items.map((quiz) => (
                <tr key={quiz.id}>
                  <td>
                    <Link to={`/admin/quizzes/${quiz.id}`}>{quiz.title}</Link>
                    {quiz.description && <div className="muted small">{quiz.description}</div>}
                  </td>
                  <td className="numeric">{quiz.questionCount}</td>
                  <td>{formatDateTime(quiz.updatedAtUtc)}</td>
                  <td>
                    <div className="row" style={{ justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        disabled={quiz.questionCount === 0 || openSession.isPending}
                        title={quiz.questionCount === 0 ? 'Adicione ao menos uma pergunta' : 'Abrir sessão ao vivo'}
                        onClick={() => handleOpenSession(quiz.id)}
                      >
                        Iniciar sessão
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        disabled={duplicate.isPending}
                        onClick={() => duplicate.mutate(quiz.id)}
                      >
                        Duplicar
                      </button>
                      <button
                        type="button"
                        className="ghost"
                        disabled={remove.isPending}
                        onClick={() => handleDelete(quiz.id, quiz.title)}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">Nenhum quiz encontrado. Crie o primeiro para começar.</p>
        )}
      </div>

      {quizzes.data && quizzes.data.totalPages > 1 && (
        <div className="row-between">
          <span className="muted small">
            Página {quizzes.data.page} de {quizzes.data.totalPages} · {quizzes.data.totalCount} quizzes
          </span>
          <div className="row">
            <button type="button" className="secondary" disabled={page <= 1} onClick={() => setPage((it) => it - 1)}>
              Anterior
            </button>
            <button
              type="button"
              className="secondary"
              disabled={page >= quizzes.data.totalPages}
              onClick={() => setPage((it) => it + 1)}
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
