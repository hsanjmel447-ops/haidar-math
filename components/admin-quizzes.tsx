'use client'

import { useCallback, useEffect, useState } from 'react'

type Quiz = {
  id: number
  title: string
  chapter: string
  topic: string
  description: string | null
  is_active: boolean
  sort_order: number
  duration_minutes: number
  passing_score: number
  show_result: boolean
  max_attempts: number
}

type Question = {
  id: number
  quiz_id: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: string
  sort_order: number
  points: number
  explanation: string | null
}

export default function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [title, setTitle] = useState('')
  const [chapter, setChapter] = useState('')
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [durationMinutes, setDurationMinutes] =
    useState('0')
  const [passingScore, setPassingScore] = useState('50')
  const [maxAttempts, setMaxAttempts] = useState('1')
  const [showResult, setShowResult] = useState(true)
  const [addingQuiz, setAddingQuiz] = useState(false)
  const [updatingQuizId, setUpdatingQuizId] =
    useState<number | null>(null)

  const [selectedQuiz, setSelectedQuiz] =
    useState<Quiz | null>(null)

  const [questions, setQuestions] = useState<Question[]>([])
  const [questionsLoading, setQuestionsLoading] =
    useState(false)

  const [questionText, setQuestionText] = useState('')
  const [optionA, setOptionA] = useState('')
  const [optionB, setOptionB] = useState('')
  const [optionC, setOptionC] = useState('')
  const [optionD, setOptionD] = useState('')
  const [correctOption, setCorrectOption] = useState('A')
  const [questionSortOrder, setQuestionSortOrder] =
    useState('0')
  const [points, setPoints] = useState('1')
  const [explanation, setExplanation] = useState('')
  const [addingQuestion, setAddingQuestion] =
    useState(false)
  const [deletingQuestionId, setDeletingQuestionId] =
    useState<number | null>(null)

  const loadQuizzes = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin-quizzes', {
        method: 'GET',
        cache: 'no-store',
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'تعذر تحميل الاختبارات')
        return
      }

      setQuizzes(data.quizzes ?? [])
    } catch {
      setError('تعذر تحميل الاختبارات')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadQuestions = useCallback(
    async (quizId: number) => {
      setQuestionsLoading(true)
      setError('')

      try {
        const response = await fetch(
          `/api/admin-quiz-questions?quizId=${quizId}`,
          {
            method: 'GET',
            cache: 'no-store',
          }
        )

        const data = await response.json()

        if (!response.ok || !data.success) {
          setError(data.error || 'تعذر تحميل الأسئلة')
          return
        }

        setQuestions(data.questions ?? [])
      } catch {
        setError('تعذر تحميل الأسئلة')
      } finally {
        setQuestionsLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    loadQuizzes()
  }, [loadQuizzes])

  const addQuiz = async () => {
    if (!title.trim()) {
      setError('أدخل اسم الاختبار')
      return
    }

    if (!chapter.trim()) {
      setError('أدخل الفصل')
      return
    }

    if (!topic.trim()) {
      setError('أدخل الموضوع')
      return
    }

    setAddingQuiz(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/admin-quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          chapter: chapter.trim(),
          topic: topic.trim(),
          description: description.trim(),
          sortOrder: Number(sortOrder || 0),
          durationMinutes: Number(durationMinutes || 0),
          passingScore: Number(passingScore || 50),
          maxAttempts: Number(maxAttempts || 1),
          showResult,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'تعذر إضافة الاختبار')
        return
      }

      setTitle('')
      setChapter('')
      setTopic('')
      setDescription('')
      setSortOrder('0')
      setDurationMinutes('0')
      setPassingScore('50')
      setMaxAttempts('1')
      setShowResult(true)

      setSuccess('تمت إضافة الاختبار بنجاح ✅')

      await loadQuizzes()
    } catch {
      setError('تعذر الاتصال بالخادم')
    } finally {
      setAddingQuiz(false)
    }
  }

  const toggleQuiz = async (quiz: Quiz) => {
    setUpdatingQuizId(quiz.id)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/admin-quizzes', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId: quiz.id,
          isActive: !quiz.is_active,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'تعذر تحديث الاختبار')
        return
      }

      setQuizzes((current) =>
        current.map((item) =>
          item.id === quiz.id ? data.quiz : item
        )
      )

      if (selectedQuiz?.id === quiz.id) {
        setSelectedQuiz(data.quiz)
      }

      setSuccess(
        quiz.is_active
          ? 'تم إخفاء الاختبار ✅'
          : 'تم تفعيل الاختبار ✅'
      )
    } catch {
      setError('تعذر تحديث الاختبار')
    } finally {
      setUpdatingQuizId(null)
    }
  }

  const openQuiz = async (quiz: Quiz) => {
    setSelectedQuiz(quiz)
    setQuestions([])
    setError('')
    setSuccess('')
    await loadQuestions(quiz.id)
  }

  const closeQuiz = () => {
    setSelectedQuiz(null)
    setQuestions([])
    setQuestionText('')
    setOptionA('')
    setOptionB('')
    setOptionC('')
    setOptionD('')
    setCorrectOption('A')
    setQuestionSortOrder('0')
    setPoints('1')
    setExplanation('')
    setError('')
    setSuccess('')
  }

  const addQuestion = async () => {
    if (!selectedQuiz) return

    if (!questionText.trim()) {
      setError('أدخل نص السؤال')
      return
    }

    if (
      !optionA.trim() ||
      !optionB.trim() ||
      !optionC.trim() ||
      !optionD.trim()
    ) {
      setError('أدخل الخيارات الأربعة')
      return
    }

    setAddingQuestion(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(
        '/api/admin-quiz-questions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quizId: selectedQuiz.id,
            questionText: questionText.trim(),
            optionA: optionA.trim(),
            optionB: optionB.trim(),
            optionC: optionC.trim(),
            optionD: optionD.trim(),
            correctOption,
            sortOrder: Number(questionSortOrder || 0),
            points: Number(points || 1),
            explanation: explanation.trim(),
          }),
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'تعذر إضافة السؤال')
        return
      }

      setQuestionText('')
      setOptionA('')
      setOptionB('')
      setOptionC('')
      setOptionD('')
      setCorrectOption('A')
      setQuestionSortOrder(
        String(Number(questionSortOrder || 0) + 1)
      )
      setPoints('1')
      setExplanation('')

      setSuccess('تمت إضافة السؤال بنجاح ✅')

      await loadQuestions(selectedQuiz.id)
    } catch {
      setError('تعذر إضافة السؤال')
    } finally {
      setAddingQuestion(false)
    }
  }

  const deleteQuestion = async (question: Question) => {
    const confirmed = window.confirm(
      'هل أنت متأكد من حذف هذا السؤال؟'
    )

    if (!confirmed) return

    setDeletingQuestionId(question.id)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(
        '/api/admin-quiz-questions',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questionId: question.id,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'تعذر حذف السؤال')
        return
      }

      setQuestions((current) =>
        current.filter((item) => item.id !== question.id)
      )

      setSuccess('تم حذف السؤال بنجاح ✅')
    } catch {
      setError('تعذر حذف السؤال')
    } finally {
      setDeletingQuestionId(null)
    }
  }

  return (
    <section
      dir="rtl"
      className="mt-6 rounded-2xl border border-yellow-400/30 bg-zinc-950 p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">
            📝 إدارة الاختبارات الخاصة
          </h2>

          <p className="mt-1 text-sm text-zinc-400">
            إنشاء الاختبارات وإضافة الأسئلة للطلاب
          </p>
        </div>

        <button
          type="button"
          onClick={loadQuizzes}
          disabled={loading}
          className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold disabled:opacity-50"
        >
          {loading ? 'جاري التحديث...' : 'تحديث'}
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {success && (
        <p className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
          {success}
        </p>
      )}

      {!selectedQuiz ? (
        <>
          <div className="mt-6 border-t border-zinc-800 pt-6">
            <h3 className="text-xl font-bold">
              إضافة اختبار جديد
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input
                type="text"
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                placeholder="الفصل - مثال: الفصل الأول"
                className="rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
              />

              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="الموضوع - مثال: الدائرة"
                className="rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
              />

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="اسم الاختبار"
                className="rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
              />

              <input
                type="number"
                min="0"
                value={sortOrder}
                onChange={(e) =>
                  setSortOrder(e.target.value)
                }
                placeholder="ترتيب الاختبار"
                className="rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
              />

              <input
                type="number"
                min="0"
                value={durationMinutes}
                onChange={(e) =>
                  setDurationMinutes(e.target.value)
                }
                placeholder="المدة بالدقائق - 0 بدون وقت"
                className="rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
              />

              <input
                type="number"
                min="0"
                max="100"
                value={passingScore}
                onChange={(e) =>
                  setPassingScore(e.target.value)
                }
                placeholder="درجة النجاح %"
                className="rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
              />

              <input
                type="number"
                min="1"
                value={maxAttempts}
                onChange={(e) =>
                  setMaxAttempts(e.target.value)
                }
                placeholder="عدد المحاولات"
                className="rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
              />

              <label className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-black px-4 py-3">
                <input
                  type="checkbox"
                  checked={showResult}
                  onChange={(e) =>
                    setShowResult(e.target.checked)
                  }
                />

                <span>إظهار النتيجة بعد التسليم</span>
              </label>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                placeholder="وصف الاختبار - اختياري"
                rows={3}
                className="rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400 md:col-span-2"
              />
            </div>

            <button
              type="button"
              onClick={addQuiz}
              disabled={addingQuiz}
              className="mt-5 w-full rounded-xl bg-yellow-400 px-5 py-4 font-bold text-black disabled:opacity-50 md:w-auto"
            >
              {addingQuiz
                ? 'جاري إضافة الاختبار...'
                : 'إضافة الاختبار'}
            </button>
          </div>

          <div className="mt-8 border-t border-zinc-800 pt-6">
            <h3 className="text-xl font-bold">
              الاختبارات المضافة
            </h3>

            <p className="mt-1 text-sm text-zinc-400">
              العدد: {quizzes.length}
            </p>

            {loading && quizzes.length === 0 ? (
              <p className="mt-5 text-zinc-400">
                جاري تحميل الاختبارات...
              </p>
            ) : quizzes.length === 0 ? (
              <p className="mt-5 text-zinc-400">
                لا توجد اختبارات مضافة حالياً.
              </p>
            ) : (
              <div className="mt-5 space-y-3">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="rounded-xl border border-zinc-800 bg-black p-4"
                  >
                    <p className="text-sm font-bold text-yellow-400">
                      {quiz.chapter} • {quiz.topic}
                    </p>

                    <h4 className="mt-2 text-lg font-bold">
                      {quiz.title}
                    </h4>

                    {quiz.description && (
                      <p className="mt-2 text-sm text-zinc-400">
                        {quiz.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-400">
                      <span className="rounded-lg bg-zinc-900 px-3 py-2">
                        ⏱️{' '}
                        {quiz.duration_minutes > 0
                          ? `${quiz.duration_minutes} دقيقة`
                          : 'بدون وقت'}
                      </span>

                      <span className="rounded-lg bg-zinc-900 px-3 py-2">
                        النجاح: {quiz.passing_score}%
                      </span>

                      <span className="rounded-lg bg-zinc-900 px-3 py-2">
                        المحاولات: {quiz.max_attempts}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openQuiz(quiz)}
                        className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black"
                      >
                        إدارة الأسئلة
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleQuiz(quiz)}
                        disabled={updatingQuizId === quiz.id}
                        className={
                          quiz.is_active
                            ? 'rounded-xl border border-red-500/40 px-4 py-2 text-sm font-bold text-red-400 disabled:opacity-50'
                            : 'rounded-xl border border-green-500/40 px-4 py-2 text-sm font-bold text-green-400 disabled:opacity-50'
                        }
                      >
                        {updatingQuizId === quiz.id
                          ? 'جاري التحديث...'
                          : quiz.is_active
                            ? 'إخفاء الاختبار'
                            : 'إظهار الاختبار'}
                      </button>

                      <span
                        className={
                          quiz.is_active
                            ? 'rounded-xl bg-green-500/10 px-4 py-2 text-sm font-bold text-green-400'
                            : 'rounded-xl bg-red-500/10 px-4 py-2 text-sm font-bold text-red-400'
                        }
                      >
                        {quiz.is_active ? 'فعال' : 'مخفي'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="mt-6 border-t border-zinc-800 pt-6">
          <button
            type="button"
            onClick={closeQuiz}
            className="rounded-xl border border-zinc-700 px-4 py-2 font-bold"
          >
            ← رجوع للاختبارات
          </button>

          <div className="mt-5 rounded-xl border border-yellow-400/20 bg-black p-4">
            <p className="text-sm font-bold text-yellow-400">
              {selectedQuiz.chapter} • {selectedQuiz.topic}
            </p>

            <h3 className="mt-2 text-2xl font-bold">
              {selectedQuiz.title}
            </h3>
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-bold">
              إضافة سؤال جديد
            </h3>

            <textarea
              value={questionText}
              onChange={(e) =>
                setQuestionText(e.target.value)
              }
              placeholder="اكتب السؤال هنا"
              rows={4}
              className="mt-4 w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
            />

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
                placeholder="الخيار A"
                className="rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
              />

              <input
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
                placeholder="الخيار B"
                className="rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
              />

              <input
                value={optionC}
                onChange={(e) => setOptionC(e.target.value)}
                placeholder="الخيار C"
                className="rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
              />

              <input
                value={optionD}
                onChange={(e) => setOptionD(e.target.value)}
                placeholder="الخيار D"
                className="rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
              />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <label>
                <span className="mb-2 block text-sm text-zinc-400">
                  الإجابة الصحيحة
                </span>

                <select
                  value={correctOption}
                  onChange={(e) =>
                    setCorrectOption(e.target.value)
                  }
                  className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </label>

              <label>
                <span className="mb-2 block text-sm text-zinc-400">
                  ترتيب السؤال
                </span>

                <input
                  type="number"
                  min="0"
                  value={questionSortOrder}
                  onChange={(e) =>
                    setQuestionSortOrder(e.target.value)
                  }
                  className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm text-zinc-400">
                  درجة السؤال
                </span>

                <input
                  type="number"
                  min="1"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3"
                />
              </label>
            </div>

            <textarea
              value={explanation}
              onChange={(e) =>
                setExplanation(e.target.value)
              }
              placeholder="شرح الإجابة - اختياري"
              rows={3}
              className="mt-4 w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
            />

            <button
              type="button"
              onClick={addQuestion}
              disabled={addingQuestion}
              className="mt-4 w-full rounded-xl bg-yellow-400 px-5 py-4 font-bold text-black disabled:opacity-50 md:w-auto"
            >
              {addingQuestion
                ? 'جاري إضافة السؤال...'
                : 'إضافة السؤال'}
            </button>
          </div>

          <div className="mt-8 border-t border-zinc-800 pt-6">
            <h3 className="text-xl font-bold">
              أسئلة الاختبار
            </h3>

            <p className="mt-1 text-sm text-zinc-400">
              العدد: {questions.length}
            </p>

            {questionsLoading ? (
              <p className="mt-5 text-zinc-400">
                جاري تحميل الأسئلة...
              </p>
            ) : questions.length === 0 ? (
              <p className="mt-5 text-zinc-400">
                لم تتم إضافة أسئلة بعد.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="rounded-xl border border-zinc-800 bg-black p-4"
                  >
                    <p className="font-bold">
                      {index + 1}. {question.question_text}
                    </p>

                    <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                      <p
                        className={
                          question.correct_option === 'A'
                            ? 'rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-green-400'
                            : 'rounded-lg bg-zinc-900 p-3'
                        }
                      >
                        A — {question.option_a}
                      </p>

                      <p
                        className={
                          question.correct_option === 'B'
                            ? 'rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-green-400'
                            : 'rounded-lg bg-zinc-900 p-3'
                        }
                      >
                        B — {question.option_b}
                      </p>

                      <p
                        className={
                          question.correct_option === 'C'
                            ? 'rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-green-400'
                            : 'rounded-lg bg-zinc-900 p-3'
                              }
>
  C — {question.option_c}
</p>

<p
  className={
    question.correct_option === 'D'
      ? 'rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-green-400'
      : 'rounded-lg bg-zinc-900 p-3'
  }
>
  D — {question.option_d}
</p>
</div>

<div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-400">
  <span>
    الترتيب: {question.sort_order}
  </span>

  <span>
    • الدرجة: {question.points}
  </span>
</div>

{question.explanation && (
  <p className="mt-3 rounded-lg bg-zinc-900 p-3 text-sm text-zinc-300">
    الشرح: {question.explanation}
  </p>
)}

<button
  type="button"
  onClick={() => deleteQuestion(question)}
  disabled={deletingQuestionId === question.id}
  className="mt-4 rounded-xl border border-red-500/40 px-4 py-2 text-sm font-bold text-red-400 disabled:opacity-50"
>
  {deletingQuestionId === question.id
    ? 'جاري الحذف...'
    : 'حذف السؤال'}
</button>
</div>
))}
</div>
)}
</div>
</div>
)}
</section>
)
}