'use client'

import { useEffect, useState } from 'react'
import PrivateQuizzes from '@/components/private-quizzes'
import PrivateWeeklyExams from '@/components/private-weekly-exams'
type Student = {
  id: number
  name: string
}

type Lecture = {
  id: number
  title: string
  chapter: string
  topic: string
  video_url: string
  sort_order: number
}

function getDeviceId() {
  const storageKey = 'private_student_device_id'

  let deviceId = localStorage.getItem(storageKey)

  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem(storageKey, deviceId)
  }

  return deviceId
}

export default function PrivateStudentsPage() {
  const [code, setCode] = useState('')
  const [student, setStudent] = useState<Student | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  const [showLectures, setShowLectures] = useState(false)
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [showQuizzes, setShowQuizzes] = useState(false)
  const [showWeeklyExams, setShowWeeklyExams] = useState(false)
  const [lecturesLoading, setLecturesLoading] = useState(false)
  const [lecturesError, setLecturesError] = useState('')

  useEffect(() => {
    const checkSession = async () => {
      try {
        const deviceId = getDeviceId()

        const response = await fetch('/api/private-session', {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'x-device-id': deviceId,
          },
        })

        const data = await response.json()

        if (response.ok && data.success && data.student) {
          setStudent(data.student)
        }
      } catch {
        // إذا فشل فحص الجلسة تظهر شاشة تسجيل الدخول
      } finally {
        setCheckingSession(false)
      }
    }

    checkSession()
  }, [])

  const enterPrivateArea = async () => {
    if (!code.trim()) {
      setError('أدخل كود الاشتراك')
      return
    }

    setLoading(true)
    setError('')

    try {
      const deviceId = getDeviceId()

      const response = await fetch('/api/private-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim(),
          deviceId,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            data.error ||
            'تعذر تسجيل الدخول'
        )
        return
      }

      setStudent(data.student)
      setCode('')
    } catch {
      setError('تعذر الاتصال، حاول مرة أخرى')
    } finally {
      setLoading(false)
    }
  }

  const loadLectures = async () => {
    setLecturesLoading(true)
    setLecturesError('')

    try {
      const deviceId = getDeviceId()

      const response = await fetch('/api/private-lectures', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'x-device-id': deviceId,
        },
      })

      const data = await response.json()

      if (response.status === 401 || response.status === 403) {
        setLecturesError(
          data.error || 'تعذر التحقق من الاشتراك'
        )
        return
      }

      if (!response.ok || !data.success) {
        setLecturesError(
          data.error || 'تعذر تحميل المحاضرات'
        )
        return
      }

      setLectures(data.lectures ?? [])
      setShowLectures(true)
    } catch {
      setLecturesError(
        'تعذر الاتصال، حاول مرة أخرى'
      )
    } finally {
      setLecturesLoading(false)
    }
  }

  const logout = async () => {
    setLoggingOut(true)

    try {
      await fetch('/api/private-logout', {
        method: 'POST',
      })
    } catch {
      // حتى إذا فشل الطلب نعيد المستخدم لشاشة الدخول
    } finally {
      setStudent(null)
      setCode('')
      setError('')
      setLectures([])
      setShowLectures(false)
      setLecturesError('')
      setLoggingOut(false)
    }
  }

  const groupedLectures = lectures.reduce<
    Record<string, Record<string, Lecture[]>>
  >((groups, lecture) => {
    const chapter = lecture.chapter || 'بدون فصل'
    const topic = lecture.topic || 'بدون موضوع'

    if (!groups[chapter]) {
      groups[chapter] = {}
    }

    if (!groups[chapter][topic]) {
      groups[chapter][topic] = []
    }

    groups[chapter][topic].push(lecture)

    return groups
  }, {})

  if (checkingSession) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-black px-4 text-white"
      >
        <div className="text-center">
          <div className="text-4xl">🔒</div>

          <p className="mt-4 text-zinc-400">
            جاري التحقق من تسجيل الدخول...
          </p>
        </div>
      </main>
    )
  }

  if (student) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-black px-4 py-8 text-white"
      >
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-yellow-400/30 bg-zinc-950 p-6">
            <p className="text-sm font-bold text-yellow-400">
              منطقة حصرية لطلاب الخاص
            </p>

            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold">
                  أهلاً {student.name} 🎓
                </h1>

                <p className="mt-2 text-zinc-400">
                  جميع محتويات دورة الرياضيات الخاصة بك في مكان واحد.
                </p>
              </div>

              <button
                type="button"
                onClick={logout}
                disabled={loggingOut}
                className="rounded-xl border border-zinc-700 px-5 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loggingOut
                  ? 'جاري تسجيل الخروج...'
                  : 'تسجيل الخروج'}
              </button>
            </div>
          </div>

          {showWeeklyExams ? (
  <div>
    <button
      type="button"
      onClick={() => setShowWeeklyExams(false)}
      className="mt-6 rounded-xl border border-zinc-700 px-5 py-3 font-bold"
    >
      رجوع للمحتوى
    </button>

    <PrivateWeeklyExams />
  </div>
) : showQuizzes ? (
  <PrivateQuizzes
    deviceId={getDeviceId()}
    onBack={() => setShowQuizzes(false)}
  />
) : !showLectures ? (
            <section className="mt-6">
              <h2 className="text-2xl font-bold">
                محتوى طلاب الخاص
              </h2>

              <p className="mt-2 text-zinc-400">
                اختر القسم الذي تريد الدخول إليه.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-yellow-400/30 bg-zinc-950 p-6">
  <div className="text-4xl">📋</div>

  <h3 className="mt-4 text-xl font-bold text-yellow-400">
    الاختبارات الأسبوعية
  </h3>

  <p className="mt-2 text-sm leading-6 text-zinc-400">
    اختبارات ورقية أسبوعية، حل الأسئلة ثم ارفع صور الحل ليتم تصحيحها من الأستاذ.
  </p>

  <button
    type="button"
    onClick={() => setShowWeeklyExams(true)}
    className="mt-5 w-full rounded-xl bg-yellow-400 px-4 py-3 font-bold text-black"
  >
    دخول الاختبارات الأسبوعية
  </button>
</div>
                <div className="rounded-2xl border border-yellow-400/30 bg-zinc-950 p-6">
                  <div className="text-4xl">🎥</div>

                  <h3 className="mt-4 text-xl font-bold text-yellow-400">
                    المحاضرات الخاصة
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    محاضرات وبثوث الدورة الخاصة مرتبة حسب الفصل والموضوع.
                  </p>

                  <button
                    type="button"
                    onClick={loadLectures}
                    disabled={lecturesLoading}
                    className="mt-5 w-full rounded-xl bg-yellow-400 px-4 py-3 font-bold text-black disabled:opacity-50"
                  >
                    {lecturesLoading
                      ? 'جاري تحميل المحاضرات...'
                      : 'عرض المحاضرات'}
                  </button>

                  {lecturesError && (
                    <p className="mt-3 text-sm text-red-400">
                      {lecturesError}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
                  <div className="text-4xl">📝</div>

                  <h3 className="mt-4 text-xl font-bold">
                    الاختبارات
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    اختبارات خاصة لمتابعة مستواك وتثبيت المادة.
                  </p>

                  <button
                    type="button"
                    onClick={() => setShowQuizzes(true)}
                    className="mt-5 w-full rounded-xl border border-zinc-700 px-4 py-3 font-bold"
                  >
                    عرض الاختبارات
                  </button>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
                  <div className="text-4xl">📚</div>

                  <h3 className="mt-4 text-xl font-bold">
                    الواجبات
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    الواجبات والتمارين المطلوبة من طلاب الخاص.
                  </p>

                  <button
                    type="button"
                    className="mt-5 w-full rounded-xl border border-zinc-700 px-4 py-3 font-bold"
                  >
                    عرض الواجبات
                  </button>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
                  <div className="text-4xl">📄</div>

                  <h3 className="mt-4 text-xl font-bold">
                    الملفات والملازم
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    الملازم والملفات والمواد المساعدة الخاصة بالدورة.
                  </p>

                  <button
                    type="button"
                    className="mt-5 w-full rounded-xl border border-zinc-700 px-4 py-3 font-bold"
                  >
                    عرض الملفات
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <section className="mt-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-yellow-400">
                    طلاب الخاص
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    🎥 المحاضرات الخاصة
                  </h2>

                  <p className="mt-2 text-zinc-400">
                    اختر الدرس المطلوب ثم افتح رابط المحاضرة.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowLectures(false)
                    setLecturesError('')
                  }}
                  className="rounded-xl border border-zinc-700 px-5 py-3 font-bold"
                >
                  رجوع للمحتوى
                </button>
              </div>

              {lectures.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center">
                  <p className="text-zinc-400">
                    لا توجد محاضرات متاحة حالياً.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-6">
                  {Object.entries(groupedLectures).map(
                    ([chapter, topics]) => (
                      <div
                        key={chapter}
                        className="rounded-2xl border border-yellow-400/30 bg-zinc-950 p-5"
                      >
                        <h3 className="text-2xl font-bold text-yellow-400">
                          {chapter}
                        </h3>

                        <div className="mt-5 space-y-5">
                          {Object.entries(topics).map(
                            ([topic, topicLectures]) => (
                              <div
                                key={topic}
                                className="rounded-xl border border-zinc-800 bg-black p-4"
                              >
                                <h4 className="text-xl font-bold">
                                  {topic}
                                </h4>

                                <div className="mt-4 space-y-3">
                                  {topicLectures.map(
                                    (lecture) => (
                                      <div
                                        key={lecture.id}
                                        className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:flex-row sm:items-center sm:justify-between"
                                      >
                                        <div>
                                          <p className="font-bold">
                                            {lecture.title}
                                          </p>

                                          <p className="mt-1 text-xs text-zinc-500">
                                            الدرس رقم{' '}
                                            {lecture.sort_order}
                                          </p>
                                        </div>

                                        <a
                                          href={
                                            lecture.video_url
                                          }
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="rounded-xl bg-yellow-400 px-5 py-3 text-center font-bold text-black"
                                        >
                                          مشاهدة المحاضرة
                                        </a>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    )
  }

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-black px-4 text-white"
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <div className="text-center">
          <div className="text-4xl">🔒</div>

          <h1 className="mt-4 text-3xl font-bold">
            طلاب الخاص
          </h1>

          <p className="mt-3 text-zinc-400">
            أدخل كود الاشتراك الخاص بك للوصول إلى المحتوى
          </p>
        </div>

        <input
          type="text"
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              enterPrivateArea()
            }
          }}
          placeholder="كود الاشتراك"
          disabled={loading}
          className="mt-7 w-full rounded-xl border border-zinc-700 bg-black px-4 py-4 text-center text-lg outline-none focus:border-yellow-400 disabled:opacity-50"
        />

        {error && (
          <p className="mt-3 text-center text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={enterPrivateArea}
          disabled={loading}
          className="mt-4 w-full rounded-xl bg-yellow-400 px-4 py-4 text-lg font-bold text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? 'جاري التحقق...'
            : 'دخول طلاب الخاص'}
        </button>

        <p className="mt-5 text-center text-xs text-zinc-500">
          هذه المنطقة مخصصة لطلاب الأستاذ حيدر محمد المشتركين
        </p>
      </div>
    </main>
  )
}