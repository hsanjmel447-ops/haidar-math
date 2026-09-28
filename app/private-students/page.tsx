'use client'

import { useEffect, useState } from 'react'
import PrivateQuizzes from '@/components/private-quizzes'
import PrivateWeeklyExams from '@/components/private-weekly-exams'
import PrivateLeaderboard from '@/components/private-leaderboard'

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

type Section =
  | 'home'
  | 'lectures'
  | 'quizzes'
  | 'weekly-exams'
  | 'leaderboard'

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

  const [activeSection, setActiveSection] =
    useState<Section>('home')

  const [lectures, setLectures] = useState<Lecture[]>([])
  const [lecturesLoading, setLecturesLoading] =
    useState(false)
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

        if (
          response.ok &&
          data.success &&
          data.student
        ) {
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
      setActiveSection('home')
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

      if (
        response.status === 401 ||
        response.status === 403
      ) {
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
      setActiveSection('lectures')
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
      setLecturesError('')
      setActiveSection('home')
      setLoggingOut(false)
    }
  }

  const goHome = () => {
    setActiveSection('home')
    setLecturesError('')
  }

  const groupedLectures = lectures.reduce<
    Record<string, Record<string, Lecture[]>>
  >((groups, lecture) => {
    const chapter =
      lecture.chapter || 'بدون فصل'

    const topic =
      lecture.topic || 'بدون موضوع'

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

          {/* رأس منطقة الطالب */}
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
                className="rounded-xl border border-zinc-700 px-5 py-3 font-bold transition hover:border-red-500 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loggingOut
                  ? 'جاري تسجيل الخروج...'
                  : 'تسجيل الخروج'}
              </button>
            </div>
          </div>

          {/* الصفحة الرئيسية */}
          {activeSection === 'home' && (
            <section className="mt-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold">
                  لوحة الطالب
                </h2>

                <p className="mt-2 text-zinc-400">
                  اختر القسم الذي تريد الدخول إليه
                </p>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-3">

                {/* المحاضرات */}
                <button
                  type="button"
                  onClick={loadLectures}
                  disabled={lecturesLoading}
                  className="group flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-yellow-400/30 bg-zinc-950 p-5 text-center transition hover:border-yellow-400 hover:bg-zinc-900 disabled:opacity-50"
                >
                  <div className="text-5xl transition group-hover:scale-110">
                    🎥
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-yellow-400">
                    المحاضرات الخاصة
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    محاضرات الدورة مرتبة حسب الفصل والموضوع
                  </p>

                  {lecturesLoading && (
                    <p className="mt-3 text-xs text-yellow-400">
                      جاري التحميل...
                    </p>
                  )}
                </button>

                {/* الاختبارات اليومية */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveSection('quizzes')
                  }
                  className="group flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-center transition hover:border-yellow-400 hover:bg-zinc-900"
                >
                  <div className="text-5xl transition group-hover:scale-110">
                    📝
                  </div>

                  <h3 className="mt-4 text-lg font-bold">
                    الاختبارات اليومية
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    اختبر مستواك وثبّت معلوماتك
                  </p>
                </button>

                {/* الاختبارات الأسبوعية */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveSection(
                      'weekly-exams'
                    )
                  }
                  className="group flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-center transition hover:border-yellow-400 hover:bg-zinc-900"
                >
                  <div className="text-5xl transition group-hover:scale-110">
                    📋
                  </div>

                  <h3 className="mt-4 text-lg font-bold">
                    الاختبارات الأسبوعية
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    حل على الورق وارفع صور إجابتك
                  </p>
                </button>

                {/* لوحة النخبة */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveSection(
                      'leaderboard'
                    )
                  }
                  className="group flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-center transition hover:border-yellow-400 hover:bg-zinc-900"
                >
                  <div className="text-5xl transition group-hover:scale-110">
                    🏆
                  </div>

                  <h3 className="mt-4 text-lg font-bold">
                    لوحة الطلبة النخبة
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    شاهد ترتيبك ونقاطك بين الطلاب
                  </p>
                </button>

                {/* الوزاريات - قريباً */}
                <div className="relative flex min-h-[180px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-yellow-400/30 bg-zinc-950 p-5 text-center">
                  <div className="absolute left-3 top-3 rounded-full bg-yellow-400 px-3 py-1 text-[10px] font-black text-black">
                    قريباً
                  </div>

                  <div className="text-5xl">
                    📚
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-yellow-400">
                    مراجعة الأسئلة الوزارية
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    شرح مختصر للأسئلة الوزارية حسب الفصل والموضوع
                  </p>
                </div>
              </div>

              {lecturesError && (
                <p className="mt-5 text-center text-sm text-red-400">
                  {lecturesError}
                </p>
              )}
            </section>
          )}

          {/* المحاضرات الخاصة */}
          {activeSection === 'lectures' && (
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
                  onClick={goHome}
                  className="rounded-xl border border-zinc-700 px-5 py-3 font-bold"
                >
                  ← رجوع للوحة الطالب
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
                  {Object.entries(
                    groupedLectures
                  ).map(
                    ([chapter, topics]) => (
                      <div
                        key={chapter}
                        className="rounded-2xl border border-yellow-400/30 bg-zinc-950 p-5"
                      >
                        <h3 className="text-2xl font-bold text-yellow-400">
                          {chapter}
                        </h3>

                        <div className="mt-5 space-y-5">
                          {Object.entries(
                            topics
                          ).map(
                            ([
                              topic,
                              topicLectures,
                            ]) => (
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
                                        key={
                                          lecture.id
                                        }
                                        className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:flex-row sm:items-center sm:justify-between"
                                      >
                                        <div>
                                          <p className="font-bold">
                                            {
                                              lecture.title
                                            }
                                          </p>

                                          <p className="mt-1 text-xs text-zinc-500">
                                            الدرس رقم{' '}
                                            {
                                              lecture.sort_order
                                            }
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

          {/* الاختبارات اليومية */}
          {activeSection === 'quizzes' && (
            <PrivateQuizzes
              deviceId={getDeviceId()}
              onBack={goHome}
            />
          )}

          {/* الاختبارات الأسبوعية */}
          {activeSection ===
            'weekly-exams' && (
            <section className="mt-6">
              <button
                type="button"
                onClick={goHome}
                className="mb-2 rounded-xl border border-zinc-700 px-5 py-3 font-bold"
              >
                ← رجوع للوحة الطالب
              </button>

              <PrivateWeeklyExams />
            </section>
          )}

          {/* لوحة النخبة */}
          {activeSection ===
            'leaderboard' && (
            <section className="mt-6">
              <button
                type="button"
                onClick={goHome}
                className="mb-2 rounded-xl border border-zinc-700 px-5 py-3 font-bold"
              >
                ← رجوع للوحة الطالب
              </button>

              <PrivateLeaderboard />
            </section>
          )}
                    {/* مراجعة الأسئلة الوزارية */}
          {activeSection ===
            'ministerial-reviews' && (
            <section className="mt-6">
              <button
                type="button"
                onClick={goHome}
                className="mb-4 rounded-xl border border-zinc-700 px-5 py-3 font-bold"
              >
                ← رجوع للوحة الطالب
              </button>

              <PrivateMinisterialReviews />
            </section>
          )}
        </div>
      </main>
    )
  }

  /* شاشة تسجيل الدخول */
  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-black px-4 text-white"
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <div className="text-center">
          <div className="text-4xl">
            🔒
          </div>

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
          onChange={(e) =>
            setCode(e.target.value)
          }
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