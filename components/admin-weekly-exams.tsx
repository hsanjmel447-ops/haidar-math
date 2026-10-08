
'use client'

import { useEffect, useState } from 'react'
import AdminWeeklyGrading from './admin-weekly-grading'

type WeeklyExam = {
  id: number
  title: string
  week_number: number
  description: string | null
  total_score: number
  points_available: number
  starts_at: string | null
  deadline_at: string | null
  is_active: boolean
  results_approved: boolean
  results_approved_at: string | null
}

type ExamQuestion = {
  id: number
  exam_id: number
  question_text: string
  question_image_url: string | null
  max_score: number
  sort_order: number
}

export default function AdminWeeklyExams() {
  const [exams, setExams] = useState<WeeklyExam[]>([])
  const [questions, setQuestions] = useState<ExamQuestion[]>([])

  const [selectedExam, setSelectedExam] =
    useState<WeeklyExam | null>(null)

  const [gradingExamId, setGradingExamId] =
    useState<number | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [approvingExamId, setApprovingExamId] =
    useState<number | null>(null)

  const [questionLoading, setQuestionLoading] =
    useState(false)

  const [
    uploadingQuestionImage,
    setUploadingQuestionImage,
  ] = useState(false)

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [title, setTitle] = useState('')
  const [weekNumber, setWeekNumber] = useState('1')
  const [description, setDescription] = useState('')
  const [totalScore, setTotalScore] = useState('100')

  const [pointsAvailable, setPointsAvailable] =
    useState('100')

  const [startsAt, setStartsAt] = useState('')
  const [deadlineAt, setDeadlineAt] = useState('')

  const [questionText, setQuestionText] = useState('')

  const [questionImageUrl, setQuestionImageUrl] =
    useState('')

  const [questionScore, setQuestionScore] =
    useState('10')

  const [questionOrder, setQuestionOrder] =
    useState('1')

  const loadExams = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        '/api/admin-weekly-exams',
        {
          cache: 'no-store',
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(
          data.error ||
            'تعذر تحميل الاختبارات الأسبوعية'
        )
        return
      }

      setExams(data.exams ?? [])
    } catch {
      setError('تعذر الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExams()
  }, [])

  const createExam = async () => {
    if (!title.trim()) {
      setError('اكتب عنوان الاختبار')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(
        '/api/admin-weekly-exams',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: title.trim(),
            weekNumber: Number(weekNumber),
            description: description.trim(),
            totalScore: Number(totalScore),
            pointsAvailable: Number(pointsAvailable),
            startsAt: startsAt
              ? new Date(startsAt).toISOString()
              : null,
            deadlineAt: deadlineAt
              ? new Date(deadlineAt).toISOString()
              : null,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(
          data.error || 'تعذر إنشاء الاختبار'
        )
        return
      }

      setTitle('')
      setDescription('')
      setStartsAt('')
      setDeadlineAt('')

      await loadExams()

      setMessage('تم إنشاء الاختبار الأسبوعي بنجاح ✅')
    } catch {
      setError('تعذر الاتصال بالخادم')
    } finally {
      setSaving(false)
    }
  }

  const toggleExam = async (exam: WeeklyExam) => {
    setError('')
    setMessage('')

    try {
      const response = await fetch(
        '/api/admin-weekly-exams',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            examId: exam.id,
            isActive: !exam.is_active,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(
          data.error || 'تعذر تحديث الاختبار'
        )
        return
      }

      setExams((current) =>
        current.map((item) =>
          item.id === exam.id
            ? {
                ...item,
                is_active: !item.is_active,
              }
            : item
        )
      )

      if (selectedExam?.id === exam.id) {
        setSelectedExam((current) =>
          current
            ? {
                ...current,
                is_active: !current.is_active,
              }
            : null
        )
      }

      setMessage(
        exam.is_active
          ? 'تم إخفاء الاختبار ✅'
          : 'تم تفعيل الاختبار ✅'
      )
    } catch {
      setError('تعذر الاتصال بالخادم')
    }
  }

  const approveResults = async (exam: WeeklyExam) => {
    if (
      exam.results_approved ||
      approvingExamId !== null
    ) {
      return
    }

    const confirmed = window.confirm(
      `هل تريد اعتماد نتائج "${exam.title}" نهائياً؟\n\nتأكد من انتهاء موعد الاختبار وتصحيح جميع التسليمات قبل المتابعة.`
    )

    if (!confirmed) return

    setApprovingExamId(exam.id)
    setError('')
    setMessage('')

    try {
      const response = await fetch(
        '/api/admin-weekly-exams',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            examId: exam.id,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(
          data.error ||
            'تعذر اعتماد نتائج الاختبار'
        )
        return
      }

      setExams((current) =>
        current.map((item) =>
          item.id === exam.id
            ? {
                ...item,
                results_approved: true,
                results_approved_at:
                  data.exam?.results_approved_at ??
                  new Date().toISOString(),
              }
            : item
        )
      )

      setSelectedExam((current) =>
        current?.id === exam.id
          ? {
              ...current,
              results_approved: true,
              results_approved_at:
                data.exam?.results_approved_at ??
                new Date().toISOString(),
            }
          : current
      )

      setMessage(
        `تم اعتماد نتائج "${exam.title}" بنجاح ✅`
      )
    } catch {
      setError(
        'تعذر الاتصال بالخادم أثناء اعتماد النتائج'
      )
    } finally {
      setApprovingExamId(null)
    }
  }

  const deleteExam = async (exam: WeeklyExam) => {
    const confirmed = window.confirm(
      `هل تريد حذف الاختبار "${exam.title}"؟`
    )

    if (!confirmed) return

    setError('')
    setMessage('')

    try {
      const response = await fetch(
        `/api/admin-weekly-exams?examId=${exam.id}`,
        {
          method: 'DELETE',
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(
          data.error || 'تعذر حذف الاختبار'
        )
        return
      }

      setExams((current) =>
        current.filter(
          (item) => item.id !== exam.id
        )
      )

      if (selectedExam?.id === exam.id) {
        setSelectedExam(null)
        setQuestions([])
      }

      if (gradingExamId === exam.id) {
        setGradingExamId(null)
      }

      setMessage('تم حذف الاختبار')
    } catch {
      setError('تعذر الاتصال بالخادم')
    }
  }

  const openQuestions = async (
    exam: WeeklyExam
  ) => {
    setSelectedExam(exam)
    setQuestions([])
    setQuestionLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(
        `/api/admin-weekly-exam-questions?examId=${exam.id}`,
        {
          cache: 'no-store',
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(
          data.error || 'تعذر تحميل الأسئلة'
        )
        return
      }

      setQuestions(data.questions ?? [])
    } catch {
      setError('تعذر الاتصال بالخادم')
    } finally {
      setQuestionLoading(false)
    }
  }

  const uploadQuestionImage = async (
    file: File | null
  ) => {
    if (!file) return

    setUploadingQuestionImage(true)
    setError('')
    setMessage('')

    try {
      const formData = new FormData()

      formData.append('file', file)

      const response = await fetch(
        '/api/admin-weekly-exam-question-upload',
        {
          method: 'POST',
          body: formData,
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(
          data.error ||
            'تعذر رفع صورة السؤال'
        )
        return
      }

      setQuestionImageUrl(data.imageUrl)

      setMessage(
        'تم رفع صورة السؤال بنجاح ✅'
      )
    } catch {
      setError(
        'تعذر الاتصال بالخادم أثناء رفع الصورة'
      )
    } finally {
      setUploadingQuestionImage(false)
    }
  }

  const addQuestion = async () => {
    if (!selectedExam) return

    if (
      !questionText.trim() &&
      !questionImageUrl.trim()
    ) {
      setError(
        'اكتب السؤال أو ارفع صورة للسؤال'
      )
      return
    }

    if (uploadingQuestionImage) {
      setError(
        'انتظر حتى يكتمل رفع الصورة'
      )
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(
        '/api/admin-weekly-exam-questions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            examId: selectedExam.id,
            questionText: questionText.trim(),
            questionImageUrl:
              questionImageUrl.trim(),
            maxScore: Number(questionScore),
            sortOrder: Number(questionOrder),
          }),
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(
          data.error || 'تعذر إضافة السؤال'
        )
        return
      }

      setQuestionText('')
      setQuestionImageUrl('')

      setQuestionOrder((current) =>
        String(Number(current || 0) + 1)
      )

      await openQuestions(selectedExam)

      setMessage('تمت إضافة السؤال بنجاح ✅')
    } catch {
      setError('تعذر الاتصال بالخادم')
    } finally {
      setSaving(false)
    }
  }

  const deleteQuestion = async (
    question: ExamQuestion
  ) => {
    if (!selectedExam) return

    const confirmed = window.confirm(
      'هل تريد حذف هذا السؤال؟'
    )

    if (!confirmed) return

    setError('')
    setMessage('')

    try {
      const response = await fetch(
        `/api/admin-weekly-exam-questions?questionId=${question.id}`,
        {
          method: 'DELETE',
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(
          data.error || 'تعذر حذف السؤال'
        )
        return
      }

      setQuestions((current) =>
        current.filter(
          (item) => item.id !== question.id
        )
      )

      setMessage('تم حذف السؤال')
    } catch {
      setError('تعذر الاتصال بالخادم')
    }
  }

  const questionsTotal = questions.reduce(
    (sum, question) =>
      sum + Number(question.max_score || 0),
    0
  )

  return (
    <section
      dir="rtl"
      className="mt-8 rounded-2xl border border-yellow-400/30 bg-zinc-950 p-5 sm:p-6"
    >
      <div>
        <p className="text-sm font-bold text-yellow-400">
          📝 الاختبارات الأسبوعية
        </p>

        <h2 className="mt-2 text-2xl font-bold">
          إدارة الاختبارات الورقية
        </h2>

        <p className="mt-2 text-sm leading-6 text-zinc-400">
          أنشئ اختباراً أسبوعياً ثم أضف الأسئلة
          ودرجاتها. بعد انتهاء الاختبار وتصحيح
          التسليمات يمكنك اعتماد النتائج.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-sm text-zinc-400">
            عنوان الاختبار
          </label>

          <input
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            placeholder="مثلاً: اختبار الأسبوع الأول"
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
          />
        </div>

        <div>
          <label className="text-sm text-zinc-400">
            رقم الأسبوع
          </label>

          <input
            type="number"
            min="1"
            value={weekNumber}
            onChange={(e) =>
              setWeekNumber(e.target.value)
            }
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
          />
        </div>

        <div>
          <label className="text-sm text-zinc-400">
            الدرجة الكلية
          </label>

          <input
            type="number"
            min="1"
            value={totalScore}
            onChange={(e) =>
              setTotalScore(e.target.value)
            }
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
          />
        </div>

        <div>
          <label className="text-sm text-zinc-400">
            نقاط النخبة
          </label>

          <input
            type="number"
            min="0"
            value={pointsAvailable}
            onChange={(e) =>
              setPointsAvailable(e.target.value)
            }
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
          />
        </div>

        <div>
          <label className="text-sm text-zinc-400">
            بداية الاختبار
          </label>

          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) =>
              setStartsAt(e.target.value)
            }
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
          />
        </div>

        <div>
          <label className="text-sm text-zinc-400">
            موعد التسليم
          </label>

          <input
            type="datetime-local"
            value={deadlineAt}
            onChange={(e) =>
              setDeadlineAt(e.target.value)
            }
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm text-zinc-400">
            وصف الاختبار — اختياري
          </label>

          <textarea
            rows={3}
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            placeholder="تعليمات الاختبار..."
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {message && (
        <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
          {message}
        </div>
      )}

      <button
        type="button"
        onClick={createExam}
        disabled={saving}
        className="mt-5 w-full rounded-xl bg-yellow-400 px-5 py-4 font-bold text-black disabled:opacity-50"
      >
        {saving
          ? 'جاري الحفظ...'
          : 'إنشاء الاختبار الأسبوعي'}
      </button>

      <div className="mt-8 border-t border-zinc-800 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-bold">
            الاختبارات المضافة
          </h3>

          <button
            type="button"
            onClick={loadExams}
            disabled={loading}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm font-bold disabled:opacity-50"
          >
            {loading ? 'جاري التحديث...' : 'تحديث'}
          </button>
        </div>

        {loading ? (
          <p className="mt-4 text-zinc-400">
            جاري التحميل...
          </p>
        ) : exams.length === 0 ? (
          <p className="mt-4 rounded-xl border border-zinc-800 bg-black p-4 text-zinc-400">
            لا توجد اختبارات أسبوعية بعد.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="rounded-xl border border-zinc-800 bg-black p-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold">
                        {exam.title}
                      </h4>

                      <span className="rounded-full border border-zinc-700 px-2 py-1 text-xs text-zinc-400">
                        الأسبوع {exam.week_number}
                      </span>

                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          exam.is_active
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {exam.is_active
                          ? 'مفعّل'
                          : 'مخفي'}
                      </span>

                      <span
                        className={`rounded-full px-2 py-1 text-xs font-bold ${
                          exam.results_approved
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-yellow-400/10 text-yellow-400'
                        }`}
                      >
                        {exam.results_approved
                          ? '✅ النتائج معتمدة'
                          : '⏳ النتائج غير معتمدة'}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-zinc-400">
                      الدرجة: {exam.total_score} •
                      النقاط: {exam.points_available}
                    </p>

                    {exam.results_approved &&
                      exam.results_approved_at && (
                        <p className="mt-2 text-xs text-green-400">
                          تاريخ الاعتماد:{' '}
                          {new Date(
                            exam.results_approved_at
                          ).toLocaleString('ar-IQ', {
                            timeZone: 'Asia/Baghdad',
                          })}
                        </p>
                      )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openQuestions(exam)
                      }
                      className="rounded-lg bg-yellow-400 px-3 py-2 text-sm font-bold text-black"
                    >
                      إدارة الأسئلة
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        toggleExam(exam)
                      }
                      className="rounded-lg border border-yellow-400/40 px-3 py-2 text-sm font-bold text-yellow-400"
                    >
                      {exam.is_active
                        ? 'إخفاء'
                        : 'تفعيل'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setGradingExamId(exam.id)
                        setSelectedExam(null)
                      }}
                      className="rounded-lg border border-green-500/40 px-3 py-2 text-sm font-bold text-green-400"
                    >
                      تصحيح التسليمات
                    </button>

                    {exam.results_approved ? (
                      <span className="rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm font-bold text-green-400">
                        🏅 تم الاعتماد
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          approveResults(exam)
                        }
                        disabled={
                          approvingExamId !== null
                        }
                        className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-sm font-bold text-blue-400 disabled:opacity-50"
                      >
                        {approvingExamId === exam.id
                          ? 'جاري اعتماد النتائج...'
                          : '🏅 اعتماد النتائج'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        deleteExam(exam)
                      }
                      className="rounded-lg border border-red-500/40 px-3 py-2 text-sm font-bold text-red-400"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedExam && (
        <div className="mt-8 rounded-2xl border border-yellow-400/30 bg-black p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-yellow-400">
                أسئلة الاختبار
              </p>

              <h3 className="mt-1 text-xl font-bold">
                {selectedExam.title}
              </h3>

              <p className="mt-2 text-sm text-zinc-400">
                مجموع درجات الأسئلة:{' '}
                {questionsTotal} /{' '}
                {selectedExam.total_score}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedExam(null)
                setQuestions([])
                setQuestionText('')
                setQuestionImageUrl('')
              }}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-sm"
            >
              إغلاق
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm text-zinc-400">
                نص السؤال — اختياري إذا عندك صورة
              </label>

              <textarea
                rows={3}
                value={questionText}
                onChange={(e) =>
                  setQuestionText(e.target.value)
                }
                placeholder="اكتب السؤال هنا، أو ارفع صورة السؤال"
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-yellow-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-bold text-zinc-300">
                📷 صورة السؤال — اختياري
              </label>

              <div className="mt-2 rounded-xl border border-dashed border-yellow-400/40 bg-zinc-950 p-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    uploadQuestionImage(
                      e.target.files?.[0] ?? null
                    )
                  }
                  disabled={uploadingQuestionImage}
                  className="block w-full text-sm text-zinc-300 file:ml-3 file:rounded-lg file:border-0 file:bg-yellow-400 file:px-4 file:py-2 file:font-bold file:text-black"
                />

                <p className="mt-3 text-xs text-zinc-500">
                  اختر صورة من الاستديو أو الكاميرا.
                  الحد الأقصى 10MB.
                </p>

                {uploadingQuestionImage && (
                  <div className="mt-4 rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-3 text-sm font-bold text-yellow-400">
                    جاري رفع صورة السؤال...
                  </div>
                )}

                {questionImageUrl &&
                  !uploadingQuestionImage && (
                    <div className="mt-4">
                      <p className="mb-2 text-sm font-bold text-green-400">
                        ✅ تم رفع الصورة
                      </p>

                      <img
                        src={questionImageUrl}
                        alt="معاينة صورة السؤال"
                        className="max-h-96 w-full rounded-xl border border-zinc-700 bg-black object-contain"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setQuestionImageUrl('')
                        }
                        className="mt-3 rounded-lg border border-red-500/40 px-3 py-2 text-sm font-bold text-red-400"
                      >
                        إزالة الصورة
                      </button>
                    </div>
                  )}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm text-zinc-500">
                رابط صورة خارجي — اختياري
              </label>

              <input
                value={questionImageUrl}
                onChange={(e) =>
                  setQuestionImageUrl(
                    e.target.value
                  )
                }
                placeholder="يمكنك أيضاً لصق رابط صورة مباشر"
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400">
                درجة السؤال
              </label>

              <input
                type="number"
                min="1"
                value={questionScore}
                onChange={(e) =>
                  setQuestionScore(
                    e.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400">
                ترتيب السؤال
              </label>

              <input
                type="number"
                min="0"
                value={questionOrder}
                onChange={(e) =>
                  setQuestionOrder(
                    e.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-yellow-400"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={addQuestion}
            disabled={
              saving || uploadingQuestionImage
            }
            className="mt-4 w-full rounded-xl bg-yellow-400 px-4 py-3 font-bold text-black disabled:opacity-50"
          >
            {uploadingQuestionImage
              ? 'انتظر رفع الصورة...'
              : saving
                ? 'جاري إضافة السؤال...'
                : 'إضافة السؤال'}
          </button>

          <div className="mt-6">
            {questionLoading ? (
              <p className="text-zinc-400">
                جاري تحميل الأسئلة...
              </p>
            ) : questions.length === 0 ? (
              <p className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-400">
                لم تتم إضافة أسئلة بعد.
              </p>
            ) : (
              <div className="space-y-3">
                {questions.map(
                  (question, index) => (
                    <div
                      key={question.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold">
                            السؤال {index + 1}
                          </p>

                          <p className="mt-1 text-sm text-yellow-400">
                            {question.max_score} درجة
                          </p>

                          {question.question_text &&
                            question.question_text !==
                              'سؤال بصورة' && (
                              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                                {
                                  question.question_text
                                }
                              </p>
                            )}

                          {question.question_image_url && (
                            <img
                              src={
                                question.question_image_url
                              }
                              alt={`السؤال ${
                                index + 1
                              }`}
                              className="mt-3 max-h-80 w-full rounded-xl border border-zinc-800 object-contain"
                            />
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            deleteQuestion(
                              question
                            )
                          }
                          className="shrink-0 rounded-lg border border-red-500/40 px-3 py-2 text-sm font-bold text-red-400"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {gradingExamId !== null && (
        <AdminWeeklyGrading
          examId={gradingExamId}
          onBack={() =>
            setGradingExamId(null)
          }
        />
      )}
    </section>
  )
}
