'use client'

import { useEffect, useState } from 'react'

type Exam = {
  id: number
  title: string
  week_number: number
  description: string | null
  total_score: number
  points_available: number
  starts_at: string | null
  deadline_at: string | null
  deadline_passed: boolean
  submission: {
    id: number
    status: string
    submitted_at: string | null
    final_score: number
    earned_points: number
    teacher_note: string | null
    graded_at: string | null
  } | null
}

type AnswerFile = {
  id: number
  file_path: string
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

type ExamDetails = {
  exam: {
    id: number
    title: string
    week_number: number
    description: string | null
    total_score: number
    points_available: number
    starts_at: string | null
    deadline_at: string | null
    deadline_passed: boolean
  }
  submission: {
    id: number
    status: string
    submitted_at: string | null
    final_score: number
    earned_points: number
    teacher_note: string | null
    graded_at: string | null
  } | null
  questions: Question[]
}

function getDeviceId() {
  if (typeof window === 'undefined') return ''

  let deviceId =
    localStorage.getItem('private_student_device_id')

  if (!deviceId) {
    deviceId = crypto.randomUUID()
   localStorage.setItem(
  'private_student_device_id',
  deviceId
)
  }

  return deviceId
}

function formatDate(value: string | null) {
  if (!value) return 'غير محدد'

  return new Intl.DateTimeFormat('ar-IQ', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function statusText(status?: string) {
  if (status === 'graded') return 'تم التصحيح'
  if (status === 'submitted') return 'تم التسليم'
  if (status === 'draft') return 'قيد الحل'

  return 'لم يبدأ'
}

export default function PrivateWeeklyExams() {
  const [exams, setExams] = useState<Exam[]>([])
  const [selected, setSelected] =
    useState<ExamDetails | null>(null)

  const [loading, setLoading] = useState(true)
  const [openingId, setOpeningId] =
    useState<number | null>(null)

  const [uploadingQuestionId, setUploadingQuestionId] =
    useState<number | null>(null)

  const [submitting, setSubmitting] =
    useState(false)

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function apiFetch(
    url: string,
    options: RequestInit = {}
  ) {
    const headers = new Headers(options.headers)

    headers.set(
      'x-device-id',
      getDeviceId()
    )

    return fetch(url, {
      ...options,
      headers,
    })
  }

  async function loadExams() {
    setLoading(true)
    setError('')

    try {
      const response = await apiFetch(
        '/api/private-weekly-exams'
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            'تعذر تحميل الاختبارات'
        )
      }

      setExams(data.exams ?? [])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'تعذر تحميل الاختبارات'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExams()
  }, [])

  async function openExam(examId: number) {
    setOpeningId(examId)
    setError('')
    setMessage('')

    try {
      const response = await apiFetch(
        `/api/private-weekly-exam-questions?examId=${examId}`
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            'تعذر فتح الاختبار'
        )
      }

      setSelected(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'تعذر فتح الاختبار'
      )
    } finally {
      setOpeningId(null)
    }
  }

  async function uploadFile(
    questionId: number,
    file: File
  ) {
    if (!selected) return

    setUploadingQuestionId(questionId)
    setError('')
    setMessage('')

    try {
      const formData = new FormData()

      formData.append(
        'examId',
        String(selected.exam.id)
      )

      formData.append(
        'questionId',
        String(questionId)
      )

      formData.append('file', file)

      const response = await apiFetch(
        '/api/private-weekly-exam-upload',
        {
          method: 'POST',
          body: formData,
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            'تعذر رفع الصورة'
        )
      }

      setMessage('تم رفع صورة الحل بنجاح')

      await openExam(selected.exam.id)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'تعذر رفع الصورة'
      )
    } finally {
      setUploadingQuestionId(null)
    }
  }

  async function submitExam() {
    if (!selected) return

    const confirmed = window.confirm(
      'هل أنت متأكد من التسليم النهائي؟ بعد التسليم لن تتمكن من تعديل الحل.'
    )

    if (!confirmed) return

    setSubmitting(true)
    setError('')
    setMessage('')

    try {
      const response = await apiFetch(
        '/api/private-weekly-exam-submit',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            examId: selected.exam.id,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            'تعذر تسليم الاختبار'
        )
      }

      setMessage(
        'تم تسليم الاختبار بنجاح ✅'
      )

      await openExam(selected.exam.id)
      await loadExams()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'تعذر تسليم الاختبار'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (selected) {
    const locked =
      selected.submission?.status ===
        'submitted' ||
      selected.submission?.status ===
        'graded' ||
      selected.exam.deadline_passed

    return (
      <section
        style={{
          marginTop: 28,
          padding: 20,
          borderRadius: 22,
          border:
            '1px solid rgba(250,204,21,.25)',
          background:
            'rgba(255,255,255,.03)',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setSelected(null)
            setError('')
            setMessage('')
          }}
          style={{
            border: 0,
            background: 'transparent',
            color: '#facc15',
            fontWeight: 800,
            cursor: 'pointer',
            marginBottom: 18,
          }}
        >
          ← العودة للاختبارات
        </button>

        <h2
          style={{
            margin: 0,
            fontSize: 26,
          }}
        >
          {selected.exam.title}
        </h2>

        <p
          style={{
            opacity: 0.75,
            lineHeight: 1.8,
          }}
        >
          الأسبوع {selected.exam.week_number}
          {' • '}
          الدرجة {selected.exam.total_score}
          {' • '}
          نقاط النخبة{' '}
          {selected.exam.points_available}
        </p>

        {selected.exam.description && (
          <p
            style={{
              lineHeight: 1.9,
              opacity: 0.9,
            }}
          >
            {selected.exam.description}
          </p>
        )}

        <div
          style={{
            padding: 14,
            marginBottom: 18,
            borderRadius: 14,
            background:
              'rgba(250,204,21,.08)',
          }}
        >
          موعد التسليم:{' '}
          <strong>
            {formatDate(
              selected.exam.deadline_at
            )}
          </strong>
        </div>

        {message && (
          <div
            style={{
              padding: 12,
              marginBottom: 14,
              borderRadius: 12,
              background:
                'rgba(34,197,94,.12)',
            }}
          >
            {message}
          </div>
        )}

        {error && (
          <div
            style={{
              padding: 12,
              marginBottom: 14,
              borderRadius: 12,
              background:
                'rgba(239,68,68,.12)',
            }}
          >
            {error}
          </div>
        )}

        {selected.questions.map(
          (question, index) => (
            <article
              key={question.id}
              style={{
                padding: 18,
                marginBottom: 16,
                borderRadius: 18,
                border:
                  '1px solid rgba(255,255,255,.1)',
                background:
                  'rgba(0,0,0,.25)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <strong>
                  السؤال {index + 1}
                </strong>

                <span
                  style={{
                    color: '#facc15',
                    fontWeight: 800,
                  }}
                >
                  {question.max_score} درجة
                </span>
              </div>

              <div
                style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.9,
                  fontSize: 17,
                }}
              >
                {question.question_text}
              </div>

              {question.question_image_url && (
                <img
                  src={
                    question.question_image_url
                  }
                  alt={`السؤال ${index + 1}`}
                  style={{
                    display: 'block',
                    width: '100%',
                    maxWidth: 700,
                    marginTop: 14,
                    borderRadius: 14,
                  }}
                />
              )}

              {question.answer?.files &&
  question.answer.files.length > 0 && (
    <div
      style={{
        marginTop: 16,
        padding: 12,
        borderRadius: 12,
        background:
          'rgba(34,197,94,.08)',
      }}
    >
      <div
        style={{
          marginBottom: 12,
          fontWeight: 800,
        }}
      >
        تم رفع{' '}
        {question.answer.files.length}{' '}
        صورة للحل ✅
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 10,
        }}
      >
        {question.answer.files.map(
          (file, fileIndex) =>
            file.signed_url ? (
              <a
                key={file.id}
                href={file.signed_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                }}
              >
                <img
                  src={file.signed_url}
                  alt={`صورة الحل ${
                    fileIndex + 1
                  }`}
                  style={{
                    display: 'block',
                    width: '100%',
                    height: 180,
                    objectFit: 'cover',
                    borderRadius: 12,
                    border:
                      '1px solid rgba(255,255,255,.12)',
                  }}
                />
              </a>
            ) : null
        )}
      </div>
    </div>
  )}
              {!locked && (
                <label
                  style={{
                    display: 'block',
                    marginTop: 14,
                    padding: 14,
                    borderRadius: 14,
                    textAlign: 'center',
                    cursor: 'pointer',
                    fontWeight: 900,
                    background: '#facc15',
                    color: '#111',
                  }}
                >
                  {uploadingQuestionId ===
                  question.id
                    ? 'جاري رفع الصورة...'
                    : '📷 رفع صورة الحل'}

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                    disabled={
                      uploadingQuestionId ===
                      question.id
                    }
                    onChange={(event) => {
                      const file =
                        event.target.files?.[0]

                      if (file) {
                        uploadFile(
                          question.id,
                          file
                        )
                      }

                      event.target.value = ''
                    }}
                    style={{
                      display: 'none',
                    }}
                  />
                </label>
              )}

              {selected.submission?.status ===
                'graded' && (
                <div
                  style={{
                    marginTop: 14,
                    padding: 12,
                    borderRadius: 12,
                    background:
                      'rgba(255,255,255,.05)',
                  }}
                >
                  درجة السؤال:{' '}
                  <strong>
                    {question.answer?.score ??
                      0}{' '}
                    / {question.max_score}
                  </strong>

                  {question.answer
                    ?.teacher_note && (
                    <div
                      style={{
                        marginTop: 8,
                        opacity: 0.8,
                      }}
                    >
                      ملاحظة الأستاذ:{' '}
                      {
                        question.answer
                          .teacher_note
                      }
                    </div>
                  )}
                </div>
              )}
            </article>
          )
        )}

        {selected.submission?.status ===
          'graded' && (
          <div
            style={{
              padding: 18,
              borderRadius: 18,
              marginTop: 18,
              background:
                'rgba(250,204,21,.1)',
              border:
                '1px solid rgba(250,204,21,.25)',
            }}
          >
            <h3
              style={{
                marginTop: 0,
              }}
            >
              نتيجة الاختبار
            </h3>

            <p>
              الدرجة:{' '}
              <strong>
                {
                  selected.submission
                    .final_score
                }{' '}
                / {selected.exam.total_score}
              </strong>
            </p>

            <p>
              نقاط النخبة:{' '}
              <strong>
                {
                  selected.submission
                    .earned_points
                }
              </strong>
            </p>

            {selected.submission
              .teacher_note && (
              <p>
                ملاحظة الأستاذ:{' '}
                {
                  selected.submission
                    .teacher_note
                }
              </p>
            )}
          </div>
        )}

        {selected.submission?.status ===
          'submitted' && (
          <div
            style={{
              marginTop: 18,
              padding: 16,
              textAlign: 'center',
              borderRadius: 16,
              background:
                'rgba(34,197,94,.1)',
            }}
          >
            تم تسليم الاختبار، وبانتظار
            التصحيح.
          </div>
        )}

        {selected.exam.deadline_passed &&
          selected.submission?.status ===
            'draft' && (
            <div
              style={{
                marginTop: 18,
                padding: 16,
                textAlign: 'center',
                borderRadius: 16,
                background:
                  'rgba(239,68,68,.1)',
              }}
            >
              انتهى موعد تسليم هذا الاختبار.
            </div>
          )}

        {!locked && (
          <button
            type="button"
            onClick={submitExam}
            disabled={submitting}
            style={{
              width: '100%',
              marginTop: 20,
              padding: 16,
              border: 0,
              borderRadius: 16,
              background: '#facc15',
              color: '#111',
              fontSize: 17,
              fontWeight: 900,
              cursor: 'pointer',
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting
              ? 'جاري التسليم...'
              : 'تسليم الاختبار نهائياً'}
          </button>
        )}
      </section>
    )
  }

  return (
    <section
      style={{
        marginTop: 28,
        padding: 20,
        borderRadius: 22,
        border:
          '1px solid rgba(250,204,21,.25)',
        background:
          'rgba(255,255,255,.03)',
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: 8,
        }}
      >
        📝 الاختبارات الأسبوعية
      </h2>

      <p
        style={{
          opacity: 0.7,
          marginTop: 0,
          lineHeight: 1.8,
        }}
      >
        حل الأسئلة على الورق ثم ارفع صور
        الحل لكل سؤال.
      </p>

      {error && (
        <div
          style={{
            padding: 12,
            marginBottom: 14,
            borderRadius: 12,
            background:
              'rgba(239,68,68,.12)',
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <p>جاري تحميل الاختبارات...</p>
      ) : exams.length === 0 ? (
        <p
          style={{
            opacity: 0.7,
          }}
        >
          لا توجد اختبارات أسبوعية متاحة
          حالياً.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gap: 14,
          }}
        >
          {exams.map((exam) => {
            const cannotOpen =
              exam.deadline_passed &&
              !exam.submission

            return (
              <article
                key={exam.id}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  border:
                    '1px solid rgba(255,255,255,.1)',
                  background:
                    'rgba(0,0,0,.2)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    gap: 12,
                  }}
                >
                  <div>
                    <strong
                      style={{
                        fontSize: 18,
                      }}
                    >
                      {exam.title}
                    </strong>

                    <div
                      style={{
                        opacity: 0.65,
                        marginTop: 6,
                      }}
                    >
                      الأسبوع{' '}
                      {exam.week_number}
                    </div>
                  </div>

                  <span
                    style={{
                      color: '#facc15',
                      fontWeight: 800,
                    }}
                  >
                    {statusText(
                      exam.submission?.status
                    )}
                  </span>
                </div>

                <p
                  style={{
                    opacity: 0.75,
                  }}
                >
                  الدرجة {exam.total_score}
                  {' • '}
                  نقاط النخبة{' '}
                  {exam.points_available}
                </p>

                <p
                  style={{
                    fontSize: 14,
                    opacity: 0.65,
                  }}
                >
                  آخر موعد:{' '}
                  {formatDate(
                    exam.deadline_at
                  )}
                </p>

                {exam.submission?.status ===
                  'graded' && (
                  <div
                    style={{
                      marginBottom: 12,
                      fontWeight: 800,
                    }}
                  >
                    النتيجة:{' '}
                    {
                      exam.submission
                        .final_score
                    }{' '}
                    / {exam.total_score}
                  </div>
                )}

                <button
                  type="button"
                  disabled={
                    openingId === exam.id ||
                    cannotOpen
                  }
                  onClick={() =>
                    openExam(exam.id)
                  }
                  style={{
                    width: '100%',
                    padding: 13,
                    border: 0,
                    borderRadius: 13,
                    background: cannotOpen
                      ? '#444'
                      : '#facc15',
                    color: cannotOpen
                      ? '#aaa'
                      : '#111',
                    fontWeight: 900,
                    cursor: cannotOpen
                      ? 'not-allowed'
                      : 'pointer',
                  }}
                >
                  {openingId === exam.id
                    ? 'جاري الفتح...'
                    : exam.submission
                        ?.status === 'graded'
                    ? 'عرض النتيجة'
                    : exam.submission
                          ?.status ===
                        'submitted'
                    ? 'عرض الاختبار'
                    : exam.submission
                    ? 'إكمال الحل'
                    : cannotOpen
                    ? 'انتهى موعد التسليم'
                    : 'بدء الاختبار'}
                </button>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}