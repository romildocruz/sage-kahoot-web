import type { CreateQuizRequest, QuizDto } from '../../api/types'

/**
 * Limites espelhados do contrato (`openapi.json`: CreateQuizRequest/QuestionRequest/OptionRequest).
 * Valem para dar retorno imediato ao apresentador — a validação que decide continua sendo a da API.
 */
export const quizLimits = {
  titleMaxLength: 120,
  descriptionMaxLength: 500,
  questionMaxLength: 300,
  optionMaxLength: 120,
  timeLimitSeconds: { min: 5, max: 120, default: 20 },
  basePoints: { min: 100, max: 2000, default: 1000 },
  options: { min: 2, suggestedMax: 4 },
} as const

export type OptionForm = {
  /** Chave local só para o React; o servidor gera o id definitivo. */
  key: string
  text: string
  isCorrect: boolean
}

export type QuestionForm = {
  key: string
  text: string
  timeLimitSeconds: number
  basePoints: number
  options: OptionForm[]
}

export type QuizForm = {
  title: string
  description: string
  questions: QuestionForm[]
}

/**
 * Chave local dos itens do formulário. Vale só dentro do navegador — serve de `key` de lista do
 * React e de sufixo dos ids de campo; o identificador definitivo é o que o servidor gera, e
 * `toRequest` não envia chave nenhuma.
 *
 * Sequência simples, e não `crypto.randomUUID()`: aquela API é `[SecureContext]` e fica `undefined`
 * fora de https/localhost, o que quebrava a abertura do editor em publicação interna por HTTP.
 */
let keySequence = 0

const newKey = () => `k${++keySequence}`

export function emptyOption(isCorrect = false): OptionForm {
  return { key: newKey(), text: '', isCorrect }
}

export function emptyQuestion(): QuestionForm {
  return {
    key: newKey(),
    text: '',
    timeLimitSeconds: quizLimits.timeLimitSeconds.default,
    basePoints: quizLimits.basePoints.default,
    options: [emptyOption(true), emptyOption()],
  }
}

export function emptyQuiz(): QuizForm {
  return { title: '', description: '', questions: [emptyQuestion()] }
}

export function toForm(quiz: QuizDto): QuizForm {
  return {
    title: quiz.title,
    description: quiz.description ?? '',
    questions: quiz.questions
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((question) => ({
        key: question.id,
        text: question.text,
        timeLimitSeconds: question.timeLimitSeconds,
        basePoints: question.basePoints,
        options: question.options.map((option) => ({
          key: option.id,
          text: option.text,
          isCorrect: option.isCorrect,
        })),
      })),
  }
}

/** Monta o payload do contrato. A ordem das perguntas é a ordem do array. */
export function toRequest(form: QuizForm): CreateQuizRequest {
  return {
    title: form.title.trim(),
    description: form.description.trim() || null,
    questions: form.questions.map((question) => ({
      text: question.text.trim(),
      timeLimitSeconds: question.timeLimitSeconds,
      basePoints: question.basePoints,
      options: question.options.map((option) => ({ text: option.text.trim(), isCorrect: option.isCorrect })),
    })),
  }
}

/** Erros por pergunta, indexados pela chave local, mais os erros do quiz. */
export type QuizFormErrors = {
  title?: string
  questions: Record<string, string>
}

export function validate(form: QuizForm): QuizFormErrors | null {
  const errors: QuizFormErrors = { questions: {} }

  if (!form.title.trim()) {
    errors.title = 'Informe um título.'
  } else if (form.title.trim().length > quizLimits.titleMaxLength) {
    errors.title = `Máximo de ${quizLimits.titleMaxLength} caracteres.`
  }

  for (const question of form.questions) {
    const filledOptions = question.options.filter((option) => option.text.trim().length > 0)
    const correctCount = question.options.filter((option) => option.isCorrect && option.text.trim().length > 0).length

    if (!question.text.trim()) {
      errors.questions[question.key] = 'Informe o enunciado da pergunta.'
    } else if (filledOptions.length < quizLimits.options.min) {
      errors.questions[question.key] = `Informe ao menos ${quizLimits.options.min} opções.`
    } else if (correctCount !== 1) {
      errors.questions[question.key] = 'Marque exatamente uma opção correta.'
    }
  }

  const hasError = Boolean(errors.title) || Object.keys(errors.questions).length > 0
  return hasError ? errors : null
}
