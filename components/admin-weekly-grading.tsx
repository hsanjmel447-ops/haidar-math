'use client'

import { useEffect, useState } from 'react'

type AnswerFile = {
  id: number
  signed_url: string | null
  sort_order: number
}

type Question = {
  id: number
  question_text: string
  question_image_url: string | null
  max_score: number
  sort_order: number
  answer: {
    id: number
    score: number | null
    teacher_note: string | null
    files: AnswerFile[]
  } | null
}

type Submission = {
  id: number
  student_id: number
  student_name: string
  submitted_at: string | null
  status: 'submitted' | 'graded'
  final_score: number
  earned_points: number
  teacher_note: string | null
  graded_at: string | null
  questions: Question[]
}

type Exam = {
  id: number
  title: string
  week_number: number
  total_score: number
  points_available: number
}

type Props = {
  examId: number
  onBack: () => void
}

type GradeState = Record<
  number,
  {
    score: string
    teacherNote: string
  }
>

function formatDate(value: string | null) {
  if (!value) return 'غير محدد'

  return new Intl.DateTimeFormat('ar-IQ', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function AdminWeeklyGrading({
  examId,
  onBack,
}: Props) {
  const [exam, setExam] =
    useState<Exam | null>(null)

  const [submissions, setSubmissions] =
    useState<Submission[]>([])

  const [selected, setSelected] =
    useState<Submission | null>(null)

  const [grades, setGrades] =
    useState<GradeState>({})

  const [teacherNote, setTeacherNote] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [message, setMessage] =
    useState('')

  async function loadSubmissions() {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `/api/admin-weekly-exam-submissions?examId=${examId}`,
        {
          cache: 'no-store',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            'تعذر تحميل تسليمات الطلاب'
        )
      }

      setExam(data.exam)
      setSubmissions(
        data.submissions ?? []
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'تعذر تحميل التسليمات'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubmissions()
  }, [examId])

  function openSubmission(
    submission: Submission
  ) {
    const initialGrades: GradeState = {}

    for (const question of submission.questions) {
      initialGrades[question.id] = {
        score:
          question.answer?.score !== null &&
          question.answer?.score !==
            undefined
            ? String(
                question.answer.score
              )
            : '',
        teacherNote:
          question.answer?.teacher_note ??
          '',
      }
    }

    setGrades(initialGrades)
    setTeacherNote(
      submission.teacher_note ?? ''
    )
    setSelected(submission)
    setError('')
    setMessage('')
  }

  function updateScore(
    questionId: number,
    value: string
  ) {
    setGrades((current) => ({
      ...current,
      [questionId]: {
        score: value,
        teacherNote:
          current[questionId]
            ?.teacherNote ?? '',
      },
    }))
  }

  function updateQuestionNote(
    questionId: number,
    value: string
  ) {
    setGrades((current) => ({
      ...current,
      [questionId]: {
        score:
          current[questionId]
            ?.score ?? '',
        teacherNote: value,
      },
    }))
  }

  async function saveGrade() {
    if (!selected || !exam) return

    const gradeItems = []

    for (const question of selected.questions) {
      const value =
        grades[question.id]?.score ?? ''

      if (value.trim() === '') {
        setError(
          `أدخل درجة السؤال رقم ${
            selected.questions.indexOf(
              question
            ) + 1
          }`
        )
        return
      }

      const score = Number(value)

      if (
        !Number.isFinite(score) ||
        score < 0 ||
        score > question.max_score
      ) {
        setError(
          `درجة السؤال رقم ${
            selected.questions.indexOf(
              question
            ) + 1
          } يجب أن تكون بين 0 و ${question.max_score}`
        )
        return
      }

      gradeItems.push({
        questionId: question.id,
        score,
        teacherNote:
          grades[question.id]
            ?.teacherNote ?? '',
      })
    }

    setSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(
        '/api/admin-weekly-exam-grade',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            submissionId: selected.id,
            grades: gradeItems,
            teacherNote,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            'تعذر حفظ التصحيح'
        )
      }

      setMessage(
        `تم حفظ التصحيح: ${data.final_score} / ${data.total_score} — نقاط النخبة: ${data.earned_points}`
      )

      await loadSubmissions()

      setSelected(null)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'تعذر حفظ التصحيح'
      )
    } finally {
      setSaving(false)
    }
  }

  if (selected && exam) {
    return (
      <section
        dir="rtl"
        className="mt-6 rounded-2xl border border-yellow-400/30 bg-zinc-950 p-5 text-white"
      >
        <button
          type="button"
          onClick={() => {
            setSelected(null)
            setError('')
            setMessage('')
          }}
          className="rounded-xl border border-zinc-700 px-4 py-2 font-bold"
        >
          رجوع للتسليمات
        </button>

        <div className="mt-5">
          <p className="text-sm font-bold text-yellow-400">
            تصحيح الاختبار الأسبوعي
          </p>

          <h2 className="mt-1 text-2xl font-bold">
            {selected.student_name}
          </h2>

          <p className="mt-2 text-sm text-zinc-400">
            {exam.title} • الدرجة الكلية{' '}
            {exam.total_score} • نقاط النخبة{' '}
            {exam.points_available}
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            وقت التسليم:{' '}
            {formatDate(
              selected.submitted_at
            )}
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-500/10 p-3 text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-4 rounded-xl bg-green-500/10 p-3 text-green-300">
            {message}
          </div>
        )}

        <div className="mt-6 space-y-5">
          {selected.questions.map(
            (question, index) => (
              <div
                key={question.id}
                className="rounded-2xl border border-zinc-800 bg-black p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold">
                    السؤال {index + 1}
                  </h3>

                  <span className="font-bold text-yellow-400">
                    من {question.max_score}
                  </span>
                </div>

                <p className="mt-3 whitespace-pre-wrap leading-7">
                  {question.question_text}
                </p>

                {question.question_image_url && (
                  <img
                    src={
                      question.question_image_url
                    }
                    alt={`السؤال ${index + 1}`}
                    className="mt-4 w-full rounded-xl"
                  />
                )}

                {question.answer?.files?.length ? (
                  <div className="mt-5">
                    <p className="mb-3 font-bold text-zinc-300">
                      صور حل الطالب:
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {question.answer.files.map(
                        (file, fileIndex) =>
                          file.signed_url ? (
                            <a
                              key={file.id}
                              href={
                                file.signed_url
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <img
                                src={
                                  file.signed_url
                                }
                                alt={`حل السؤال ${
                                  index + 1
                                } - صورة ${
                                  fileIndex + 1
                                }`}
                                className="w-full rounded-xl border border-zinc-800"
                              />
                            </a>
                          ) : null
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">
                    لا توجد صورة حل لهذا السؤال.
                  </p>
                )}

                <label className="mt-5 block font-bold">
                  درجة السؤال
                </label>

                <input
                  type="number"
                  min="0"
                  max={question.max_score}
                  step="0.5"
                  value={
                    grades[question.id]
                      ?.score ?? ''
                  }
                  onChange={(event) =>
                    updateScore(
                      question.id,
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-yellow-400"
                  placeholder={`0 - ${question.max_score}`}
                />

                <label className="mt-4 block font-bold">
                  ملاحظة على السؤال
                </label>

                <textarea
                  value={
                    grades[question.id]
                      ?.teacherNote ?? ''
                  }
                  onChange={(event) =>
                    updateQuestionNote(
                      question.id,
                      event.target.value
                    )
                  }
                  className="mt-2 min-h-24 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-yellow-400"
                  placeholder="اختياري"
                />
              </div>
            )
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-800 bg-black p-4">
          <label className="font-bold">
            ملاحظة عامة للطالب
          </label>

          <textarea
            value={teacherNote}
            onChange={(event) =>
              setTeacherNote(
                event.target.value
              )
            }
            className="mt-2 min-h-28 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-yellow-400"
            placeholder="اختياري"
          />
        </div>

        <button
          type="button"
          onClick={saveGrade}
          disabled={saving}
          className="mt-5 w-full rounded-xl bg-yellow-400 px-5 py-4 text-lg font-bold text-black disabled:opacity-50"
        >
          {saving
            ? 'جاري حفظ التصحيح...'
            : selected.status === 'graded'
            ? 'تحديث التصحيح والنقاط'
            : 'حفظ التصحيح وإضافة النقاط'}
        </button>
      </section>
    )
  }

  return (
    <section
      dir="rtl"
      className="mt-6 rounded-2xl border border-yellow-400/30 bg-zinc-950 p-5 text-white"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-yellow-400">
            الاختبارات الأسبوعية
          </p>

          <h2 className="mt-1 text-2xl font-bold">
            تصحيح تسليمات الطلاب
          </h2>

          {exam && (
            <p className="mt-2 text-zinc-400">
              {exam.title} • الأسبوع{' '}
              {exam.week_number}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-zinc-700 px-5 py-3 font-bold"
        >
          رجوع
        </button>
      </div>

      {message && (
        <div className="mt-4 rounded-xl bg-green-500/10 p-3 text-green-300">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl bg-red-500/10 p-3 text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <p className="mt-6 text-zinc-400">
          جاري تحميل التسليمات...
        </p>
      ) : submissions.length === 0 ? (
        <div className="mt-6 rounded-xl border border-zinc-800 bg-black p-5 text-center text-zinc-400">
          لا توجد تسليمات طلاب لهذا الاختبار حتى الآن.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {submissions.map(
            (submission) => (
              <div
                key={submission.id}
                className="rounded-xl border border-zinc-800 bg-black p-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold">
                      {
                        submission.student_name
                      }
                    </h3>

                    <p className="mt-1 text-sm text-zinc-500">
                      التسليم:{' '}
                      {formatDate(
                        submission.submitted_at
                      )}
                    </p>

                    <p className="mt-2 text-sm">
                      {submission.status ===
                      'graded' ? (
                        <span className="font-bold text-green-400">
                          تم التصحيح •{' '}
                          {
                            submission.final_score
                          }{' '}
                          / {exam?.total_score} •{' '}
                          {
                            submission.earned_points
                          }{' '}
                          نقطة
                        </span>
                      ) : (
                        <span className="font-bold text-yellow-400">
                          بانتظار التصحيح
                        </span>
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      openSubmission(
                        submission
                      )
                    }
                    className="rounded-xl bg-yellow-400 px-5 py-3 font-bold text-black"
                  >
                    {submission.status ===
                    'graded'
                      ? 'مراجعة التصحيح'
                      : 'تصحيح الآن'}
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </section>
  )
}