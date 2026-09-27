'use client'

import { useEffect, useMemo, useState } from 'react'

type Quiz = {
  id: number
  title: string
  chapter: string
  topic: string
  description?: string | null
  sort_order: number
  duration_minutes: number
  passing_score: number
  show_result: boolean
  max_attempts: number
}

type Question = {
  id: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  sort_order: number
  points: number
}

type ReviewItem = {
  questionId?: number
  question_id?: number
  correctOption?: string
  correct_option?: string
  selectedOption?: string | null
  selected_option?: string | null
  explanation?: string | null
  isCorrect?: boolean
  is_correct?: boolean
}

type Result = {
  score?: number
  totalPoints?: number
  total_points?: number
  percentage?: number
  passed?: boolean
  review?: ReviewItem[]
}

type Props = {
  deviceId: string
  onBack: () => void
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, seconds)
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = safeSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(
    remainingSeconds
  ).padStart(2, '0')}`
}

export default function PrivateQuizzes({
  deviceId,
  onBack,
}: Props) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedChapter, setSelectedChapter] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('')

  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(false)

  const [attemptId, setAttemptId] = useState<number | null>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [currentQuestion, setCurrentQuestion] = useState(0)

  const [started, setStarted] = useState(false)
  const [starting, setStarting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(
    null
  )

  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    const loadQuizzes = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await fetch('/api/private-quizzes', {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'x-device-id': deviceId,
          },
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          setError(data.error || 'تعذر تحميل الاختبارات')
          return
        }

        setQuizzes(data.quizzes ?? [])
      } catch {
        setError('تعذر الاتصال، حاول مرة أخرى')
      } finally {
        setLoading(false)
      }
    }

    loadQuizzes()
  }, [deviceId])

  const chapters = useMemo(() => {
    return Array.from(
      new Set(
        quizzes.map((quiz) => quiz.chapter || 'بدون فصل')
      )
    )
  }, [quizzes])

  const topics = useMemo(() => {
    if (!selectedChapter) {
      return []
    }

    return Array.from(
      new Set(
        quizzes
          .filter(
            (quiz) =>
              (quiz.chapter || 'بدون فصل') === selectedChapter
          )
          .map((quiz) => quiz.topic || 'بدون موضوع')
      )
    )
  }, [quizzes, selectedChapter])

  const topicQuizzes = useMemo(() => {
    if (!selectedChapter || !selectedTopic) {
      return []
    }

    return quizzes
      .filter(
        (quiz) =>
          (quiz.chapter || 'بدون فصل') === selectedChapter &&
          (quiz.topic || 'بدون موضوع') === selectedTopic
      )
      .sort((a, b) => a.sort_order - b.sort_order)
  }, [quizzes, selectedChapter, selectedTopic])

  const submitQuiz = async () => {
    if (!activeQuiz || !attemptId || submitting) {
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/private-quiz-submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': deviceId,
        },
        body: JSON.stringify({
          quizId: activeQuiz.id,
          attemptId,
          answers,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'تعذر تسليم الاختبار')
        return
      }

      setResult(data.result ?? data)
      setStarted(false)
      setRemainingSeconds(null)
    } catch {
      setError('تعذر الاتصال أثناء تسليم الاختبار')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (
      !started ||
      remainingSeconds === null ||
      remainingSeconds <= 0
    ) {
      return
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current === null) {
          return null
        }

        return Math.max(0, current - 1)
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [started, remainingSeconds])

  useEffect(() => {
    if (
      started &&
      remainingSeconds === 0 &&
      !submitting
    ) {
      submitQuiz()
    }
  }, [started, remainingSeconds, submitting])

  const openQuiz = async (quiz: Quiz) => {
    setActiveQuiz(quiz)
    setQuestions([])
    setAnswers({})
    setAttemptId(null)
    setCurrentQuestion(0)
    setStarted(false)
    setResult(null)
    setRemainingSeconds(null)
    setQuestionsLoading(true)
    setError('')

    try {
      const response = await fetch(
        `/api/private-quiz-questions?quizId=${quiz.id}`,
        {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'x-device-id': deviceId,
          },
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'تعذر تحميل أسئلة الاختبار')
        return
      }

      setQuestions(data.questions ?? [])
    } catch {
      setError('تعذر الاتصال، حاول مرة أخرى')
    } finally {
      setQuestionsLoading(false)
    }
  }

  const startQuiz = async () => {
    if (!activeQuiz || starting) {
      return
    }

    setStarting(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/private-quiz-start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': deviceId,
        },
        body: JSON.stringify({
          quizId: activeQuiz.id,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(
          data.error ||
            data.message ||
            'تعذر بدء الاختبار'
        )
        return
      }

      const attempt =
        data.attempt ?? data

      const newAttemptId =
        attempt.id ??
        attempt.attemptId ??
        data.attemptId

      if (!newAttemptId) {
        setError('تعذر تحديد محاولة الاختبار')
        return
      }

      setAttemptId(Number(newAttemptId))
      setAnswers({})
      setCurrentQuestion(0)
      setStarted(true)

      if (activeQuiz.duration_minutes > 0) {
        const startedAtValue =
          attempt.started_at ??
          attempt.startedAt ??
          data.started_at ??
          data.startedAt

        if (startedAtValue) {
          const startedAt = new Date(startedAtValue).getTime()
          const expiresAt =
            startedAt +
            activeQuiz.duration_minutes * 60 * 1000

          const seconds = Math.max(
            0,
            Math.ceil((expiresAt - Date.now()) / 1000)
          )

          setRemainingSeconds(seconds)
        } else {
          setRemainingSeconds(
            activeQuiz.duration_minutes * 60
          )
        }
      } else {
        setRemainingSeconds(null)
      }
    } catch {
      setError('تعذر الاتصال، حاول مرة أخرى')
    } finally {
      setStarting(false)
    }
  }

  const closeQuiz = () => {
    if (started) {
      const confirmed = window.confirm(
        'الاختبار ما زال قيد الحل. هل تريد الرجوع؟'
      )

      if (!confirmed) {
        return
      }
    }

    setActiveQuiz(null)
    setQuestions([])
    setAnswers({})
    setAttemptId(null)
    setCurrentQuestion(0)
    setStarted(false)
    setResult(null)
    setRemainingSeconds(null)
    setError('')
  }

  const answerQuestion = (
    questionId: number,
    option: string
  ) => {
    setAnswers((current) => ({
      ...current,
      [questionId]: option,
    }))
  }

  if (loading) {
    return (
      <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center">
        <p className="text-zinc-400">
          جاري تحميل الاختبارات...
        </p>
      </section>
    )
  }

  if (activeQuiz) {
    if (questionsLoading) {
      return (
        <section className="mt-6">
          <button
            type="button"
            onClick={closeQuiz}
            className="rounded-xl border border-zinc-700 px-5 py-3 font-bold"
          >
            رجوع
          </button>

          <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center">
            <p className="text-zinc-400">
              جاري تحميل أسئلة الاختبار...
            </p>
          </div>
        </section>
      )
    }

    if (result) {
      const score = result.score ?? 0
      const totalPoints =
        result.totalPoints ??
        result.total_points ??
        0

      const percentage =
        result.percentage ?? 0

      return (
        <section className="mt-6">
          <div className="rounded-2xl border border-yellow-400/30 bg-zinc-950 p-6">
            <p className="text-sm font-bold text-yellow-400">
              نتيجة الاختبار
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              {activeQuiz.title}
            </h2>

            <div className="mt-6 rounded-2xl border border-zinc-800 bg-black p-6 text-center">
              <div className="text-5xl">
                {result.passed ? '🎉' : '📚'}
              </div>

              <p className="mt-4 text-4xl font-bold text-yellow-400">
                {percentage}%
              </p>

              <p className="mt-3 text-zinc-300">
                الدرجة: {score} من {totalPoints}
              </p>

              <p
                className={`mt-3 font-bold ${
                  result.passed
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}
              >
                {result.passed
                  ? 'ناجح في الاختبار'
                  : 'تحتاج إلى مراجعة المادة'}
              </p>
            </div>

            {Array.isArray(result.review) &&
              result.review.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h3 className="text-xl font-bold">
                    مراجعة الإجابات
                  </h3>

                  {result.review.map(
                    (item, index) => {
                      const correct =
                        item.isCorrect ??
                        item.is_correct ??
                        false

                      return (
                        <div
                          key={
                            item.questionId ??
                            item.question_id ??
                            index
                          }
                          className="rounded-xl border border-zinc-800 bg-black p-4"
                        >
                          <p
                            className={
                              correct
                                ? 'font-bold text-green-400'
                                : 'font-bold text-red-400'
                            }
                          >
                            السؤال {index + 1}:{' '}
                            {correct
                              ? 'إجابة صحيحة'
                              : 'إجابة غير صحيحة'}
                          </p>

                          {!correct && (
                            <p className="mt-2 text-sm text-zinc-300">
                              الإجابة الصحيحة:{' '}
                              {item.correctOption ??
                                item.correct_option ??
                                '-'}
                            </p>
                          )}

                          {item.explanation && (
                            <p className="mt-2 text-sm leading-6 text-zinc-400">
                              {item.explanation}
                            </p>
                          )}
                        </div>
                      )
                    }
                  )}
                </div>
              )}

            <button
              type="button"
              onClick={closeQuiz}
              className="mt-6 w-full rounded-xl bg-yellow-400 px-5 py-3 font-bold text-black"
            >
              العودة إلى الاختبارات
            </button>
          </div>
        </section>
      )
    }

    if (!started) {
      return (
        <section className="mt-6">
          <button
            type="button"
            onClick={closeQuiz}
            className="rounded-xl border border-zinc-700 px-5 py-3 font-bold"
          >
            رجوع للاختبارات
          </button>

          <div className="mt-5 rounded-2xl border border-yellow-400/30 bg-zinc-950 p-6">
            <p className="text-sm font-bold text-yellow-400">
              {activeQuiz.chapter} — {activeQuiz.topic}
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {activeQuiz.title}
            </h2>

            {activeQuiz.description && (
              <p className="mt-3 leading-7 text-zinc-400">
                {activeQuiz.description}
              </p>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-zinc-800 bg-black p-4">
                <p className="text-xs text-zinc-500">
                  عدد الأسئلة
                </p>

                <p className="mt-1 text-xl font-bold">
                  {questions.length}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-black p-4">
                <p className="text-xs text-zinc-500">
                  الوقت
                </p>

                <p className="mt-1 text-xl font-bold">
                  {activeQuiz.duration_minutes > 0
                    ? `${activeQuiz.duration_minutes} دقيقة`
                    : 'بدون وقت'}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-black p-4">
                <p className="text-xs text-zinc-500">
                  درجة النجاح
                </p>

                <p className="mt-1 text-xl font-bold">
                  {activeQuiz.passing_score}%
                </p>
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </p>
            )}

            {questions.length === 0 ? (
              <p className="mt-6 rounded-xl border border-zinc-800 bg-black p-4 text-center text-zinc-400">
                لا توجد أسئلة في هذا الاختبار حالياً.
              </p>
            ) : (
              <button
                type="button"
                onClick={startQuiz}
                disabled={starting}
                className="mt-6 w-full rounded-xl bg-yellow-400 px-5 py-4 text-lg font-bold text-black disabled:opacity-50"
              >
                {starting
                  ? 'جاري بدء الاختبار...'
                  : 'ابدأ الاختبار'}
              </button>
            )}
          </div>
        </section>
      )
    }

    const question = questions[currentQuestion]

    if (!question) {
      return (
        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-red-400">
            تعذر عرض السؤال.
          </p>
        </section>
      )
    }

    const selectedAnswer = answers[question.id]

    return (
      <section className="mt-6">
        <div className="rounded-2xl border border-yellow-400/30 bg-zinc-950 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-yellow-400">
                {activeQuiz.title}
              </p>

              <p className="mt-1 text-sm text-zinc-400">
                السؤال {currentQuestion + 1} من{' '}
                {questions.length}
              </p>
            </div>

            {remainingSeconds !== null && (
              <div
                className={`rounded-xl border px-4 py-2 font-mono text-xl font-bold ${
                  remainingSeconds <= 60
                    ? 'border-red-500/50 text-red-400'
                    : 'border-yellow-400/40 text-yellow-400'
                }`}
              >
                ⏱ {formatTime(remainingSeconds)}
              </div>
            )}
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full bg-yellow-400 transition-all"
              style={{
                width: `${
                  ((currentQuestion + 1) /
                    questions.length) *
                  100
                }%`,
              }}
            />
          </div>

          <div className="mt-6 rounded-2xl border border-zinc-800 bg-black p-5">
            <h3 className="text-xl font-bold leading-9">
              {question.question_text}
            </h3>

            <div className="mt-6 space-y-3">
              {[
                ['A', question.option_a],
                ['B', question.option_b],
                ['C', question.option_c],
                ['D', question.option_d],
              ].map(([option, text]) => (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    answerQuestion(
                      question.id,
                      option
                    )
                  }
                  className={`w-full rounded-xl border p-4 text-right transition ${
                    selectedAnswer === option
                      ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                      : 'border-zinc-800 bg-zinc-950 text-white'
                  }`}
                >
                  <span className="font-bold">
                    {option} —
                  </span>{' '}
                  {text}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                setCurrentQuestion((current) =>
                  Math.max(0, current - 1)
                )
              }
              disabled={currentQuestion === 0}
              className="rounded-xl border border-zinc-700 px-5 py-3 font-bold disabled:opacity-30"
            >
              السابق
            </button>

            {currentQuestion <
            questions.length - 1 ? (
              <button
                type="button"
                onClick={() =>
                  setCurrentQuestion((current) =>
                    Math.min(
                      questions.length - 1,
                      current + 1
                    )
                  )
                }
                className="flex-1 rounded-xl bg-yellow-400 px-5 py-3 font-bold text-black"
              >
                التالي
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const confirmed = window.confirm(
                    'هل أنت متأكد من تسليم الاختبار؟'
                  )

                  if (confirmed) {
                    submitQuiz()
                  }
                }}
                disabled={submitting}
                className="flex-1 rounded-xl bg-yellow-400 px-5 py-3 font-bold text-black disabled:opacity-50"
              >
                {submitting
                  ? 'جاري تسليم الاختبار...'
                  : 'تسليم الاختبار'}
              </button>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {questions.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  setCurrentQuestion(index)
                }
                className={`h-10 w-10 rounded-lg border text-sm font-bold ${
                  index === currentQuestion
                    ? 'border-yellow-400 bg-yellow-400 text-black'
                    : answers[item.id]
                      ? 'border-green-500/50 text-green-400'
                      : 'border-zinc-700 text-zinc-400'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-yellow-400">
            طلاب الخاص
          </p>

          <h2 className="mt-1 text-2xl font-bold">
            📝 الاختبارات
          </h2>

          <p className="mt-2 text-zinc-400">
            اختر الفصل ثم الموضوع ثم الاختبار.
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-zinc-700 px-5 py-3 font-bold"
        >
          رجوع للمحتوى
        </button>
      </div>

      {error && (
        <p className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {quizzes.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center">
          <p className="text-zinc-400">
            لا توجد اختبارات متاحة حالياً.
          </p>
        </div>
      ) : !selectedChapter ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {chapters.map((chapter) => (
            <button
              key={chapter}
              type="button"
              onClick={() => {
                setSelectedChapter(chapter)
                setSelectedTopic('')
              }}
              className="rounded-2xl border border-yellow-400/30 bg-zinc-950 p-6 text-right transition hover:border-yellow-400"
            >
              <p className="text-sm text-zinc-500">
                الفصل
              </p>

              <h3 className="mt-2 text-xl font-bold text-yellow-400">
                {chapter}
              </h3>
            </button>
          ))}
        </div>
      ) : !selectedTopic ? (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setSelectedChapter('')}
            className="rounded-xl border border-zinc-700 px-5 py-3 font-bold"
          >
            رجوع للفصول
          </button>

          <h3 className="mt-6 text-2xl font-bold text-yellow-400">
            {selectedChapter}
          </h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {topics.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => setSelectedTopic(topic)}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-right transition hover:border-yellow-400"
              >
                <p className="text-sm text-zinc-500">
                  الموضوع
                </p>

                <h4 className="mt-2 text-xl font-bold">
                  {topic}
                </h4>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setSelectedTopic('')}
            className="rounded-xl border border-zinc-700 px-5 py-3 font-bold"
          >
            رجوع للمواضيع
          </button>

          <div className="mt-6">
            <p className="text-sm text-zinc-500">
              {selectedChapter}
            </p>

            <h3 className="mt-1 text-2xl font-bold text-yellow-400">
              {selectedTopic}
            </h3>
          </div>

          <div className="mt-5 space-y-4">
            {topicQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-xl font-bold">
                      {quiz.title}
                    </h4>

                    {quiz.description && (
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        {quiz.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
                      <span>
                        ⏱{' '}
                        {quiz.duration_minutes > 0
                          ? `${quiz.duration_minutes} دقيقة`
                          : 'بدون وقت'}
                      </span>

                      <span>
                        النجاح {quiz.passing_score}%
                      </span>

                      <span>
                        المحاولات {quiz.max_attempts}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openQuiz(quiz)}
                    className="rounded-xl bg-yellow-400 px-5 py-3 font-bold text-black"
                  >
                    فتح الاختبار
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}