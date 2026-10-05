import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCreateQuiz, useQuiz, useUpdateQuiz } from '../../api/hooks/useQuizzes'
import { ApiError } from '../../api/problem'
import { ErrorAlert } from '../../components/ErrorAlert'
import { optionColor, optionMarker } from '../../lib/optionStyle'
import {
  emptyOption,
  emptyQuestion,
  emptyQuiz,
  quizLimits,
  toForm,
  toRequest,
  validate,
  type QuestionForm,
  type QuizForm,
  type QuizFormErrors,
} from './quizForm'

/**
 * Criação e edição de quiz. O contrato do PUT substitui o quiz inteiro (título, descrição e a lista
 * completa de perguntas), então o formulário carrega e devolve o agregado por completo.
 */
export function QuizEditorPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const isEditing = Boolean(quizId)
  const navigate = useNavigate()

  const existing = useQuiz(quizId)
  const create = useCreateQuiz()
  const update = useUpdateQuiz()

  const [form, setForm] = useState<QuizForm>(emptyQuiz)
  const [errors, setErrors] = useState<QuizFormErrors | null>(null)

  useEffect(() => {
    if (existing.data) {
      setForm(toForm(existing.data))
    }
  }, [existing.data])

  const saveError = create.error ?? update.error
  const apiError = saveError instanceof ApiError ? saveError : null
  const saving = create.isPending || update.isPending

  function patchQuestion(key: string, patch: Partial<QuestionForm>) {
    setForm((current) => ({
      ...current,
      questions: current.questions.map((question) => (question.key === key ? { ...question, ...patch } : question)),
    }))
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    const target = index + direction
    setForm((current) => {
      if (target < 0 || target >= current.questions.length) return current
      const questions = current.questions.slice()
      const [moved] = questions.splice(index, 1)
      questions.splice(target, 0, moved)
      return { ...current, questions }
    })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const validation = validate(form)
    setErrors(validation)
    if (validation) return

    const body = toRequest(form)

    if (isEditing && quizId) {
      await update.mutateAsync({ quizId, body })
    } else {
      const created = await create.mutateAsync(body)
      navigate(`/admin/quizzes/${created.id}`, { replace: true })
      return
    }

    navigate('/admin')
  }

  if (isEditing && existing.isPending) {
    return <div className="card skeleton" style={{ height: '8rem' }} />
  }

  if (isEditing && existing.error) {
    return <ErrorAlert error={existing.error} />
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="row-between">
        <h1>{isEditing ? 'Editar quiz' : 'Novo quiz'}</h1>
        <div className="row">
          <button type="button" className="secondary" onClick={() => navigate('/admin')}>
            Cancelar
          </button>
          <button type="submit" disabled={saving}>
            {saving ? <span className="spinner" /> : 'Salvar'}
          </button>
        </div>
      </div>

      {apiError?.isConflict && (
        <div className="alert info">
          Existe uma sessão ativa usando este quiz. Encerre a sessão antes de salvar alterações.
        </div>
      )}
      {apiError && !apiError.isConflict && <ErrorAlert error={apiError} />}

      <div className="card">
        <div className="field">
          <label htmlFor="title">Título</label>
          <input
            id="title"
            value={form.title}
            maxLength={quizLimits.titleMaxLength}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            aria-invalid={Boolean(errors?.title ?? apiError?.errorFor('title'))}
          />
          {(errors?.title ?? apiError?.errorFor('title')) && (
            <p className="field-error">{errors?.title ?? apiError?.errorFor('title')}</p>
          )}
        </div>

        <div className="field">
          <label htmlFor="description">Descrição (opcional)</label>
          <textarea
            id="description"
            rows={2}
            maxLength={quizLimits.descriptionMaxLength}
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          />
        </div>
      </div>

      {form.questions.map((question, questionIndex) => (
        <div className="card" key={question.key}>
          <div className="row-between">
            <h3>Pergunta {questionIndex + 1}</h3>
            <div className="row">
              <button
                type="button"
                className="ghost"
                disabled={questionIndex === 0}
                onClick={() => moveQuestion(questionIndex, -1)}
                aria-label="Mover para cima"
              >
                ↑
              </button>
              <button
                type="button"
                className="ghost"
                disabled={questionIndex === form.questions.length - 1}
                onClick={() => moveQuestion(questionIndex, 1)}
                aria-label="Mover para baixo"
              >
                ↓
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    questions: current.questions.filter((it) => it.key !== question.key),
                  }))
                }
              >
                Remover
              </button>
            </div>
          </div>

          <div className="field">
            <label htmlFor={`question-${question.key}`}>Enunciado</label>
            <textarea
              id={`question-${question.key}`}
              rows={2}
              maxLength={quizLimits.questionMaxLength}
              value={question.text}
              onChange={(event) => patchQuestion(question.key, { text: event.target.value })}
              aria-invalid={Boolean(errors?.questions[question.key])}
            />
          </div>

          <div className="row">
            <div className="field" style={{ minWidth: '9rem' }}>
              <label htmlFor={`time-${question.key}`}>Tempo (s)</label>
              <input
                id={`time-${question.key}`}
                type="number"
                min={quizLimits.timeLimitSeconds.min}
                max={quizLimits.timeLimitSeconds.max}
                value={question.timeLimitSeconds}
                onChange={(event) => patchQuestion(question.key, { timeLimitSeconds: Number(event.target.value) })}
              />
            </div>
            <div className="field" style={{ minWidth: '9rem' }}>
              <label htmlFor={`points-${question.key}`}>Pontuação base</label>
              <input
                id={`points-${question.key}`}
                type="number"
                min={quizLimits.basePoints.min}
                max={quizLimits.basePoints.max}
                step={100}
                value={question.basePoints}
                onChange={(event) => patchQuestion(question.key, { basePoints: Number(event.target.value) })}
              />
            </div>
          </div>

          <label>Opções (marque a correta)</label>
          <div className="stack" style={{ gap: '0.5rem' }}>
            {question.options.map((option, optionIndex) => (
              <div className="row" key={option.key}>
                <span
                  className="marker"
                  aria-hidden="true"
                  style={{
                    background: optionColor(optionIndex),
                    width: '2rem',
                    height: '2rem',
                    borderRadius: 8,
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 700,
                  }}
                >
                  {optionMarker(optionIndex)}
                </span>
                <input
                  className="grow"
                  value={option.text}
                  maxLength={quizLimits.optionMaxLength}
                  placeholder={`Opção ${optionMarker(optionIndex)}`}
                  onChange={(event) =>
                    patchQuestion(question.key, {
                      options: question.options.map((it) =>
                        it.key === option.key ? { ...it, text: event.target.value } : it,
                      ),
                    })
                  }
                />
                <label className="row small" style={{ margin: 0, whiteSpace: 'nowrap' }}>
                  <input
                    type="radio"
                    name={`correct-${question.key}`}
                    checked={option.isCorrect}
                    style={{ width: 'auto' }}
                    onChange={() =>
                      patchQuestion(question.key, {
                        options: question.options.map((it) => ({ ...it, isCorrect: it.key === option.key })),
                      })
                    }
                  />
                  Correta
                </label>
                <button
                  type="button"
                  className="ghost"
                  disabled={question.options.length <= quizLimits.options.min}
                  onClick={() =>
                    patchQuestion(question.key, {
                      options: question.options.filter((it) => it.key !== option.key),
                    })
                  }
                  aria-label="Remover opção"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="row" style={{ marginTop: '0.75rem' }}>
            <button
              type="button"
              className="secondary"
              disabled={question.options.length >= quizLimits.options.suggestedMax}
              onClick={() => patchQuestion(question.key, { options: [...question.options, emptyOption()] })}
            >
              Adicionar opção
            </button>
            <span className="muted small">Sugestão: até {quizLimits.options.suggestedMax} opções por pergunta.</span>
          </div>

          {errors?.questions[question.key] && <p className="field-error">{errors.questions[question.key]}</p>}
        </div>
      ))}

      <button
        type="button"
        className="secondary"
        onClick={() => setForm((current) => ({ ...current, questions: [...current.questions, emptyQuestion()] }))}
      >
        Adicionar pergunta
      </button>
    </form>
  )
}
