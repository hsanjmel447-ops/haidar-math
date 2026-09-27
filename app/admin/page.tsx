'use client'

import { useCallback, useEffect, useState } from 'react'

type Student = {
  id: number
  name: string
  access_code: string
  is_active: boolean
  expires_at: string | null
  created_at: string
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [checkingSession, setCheckingSession] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const [students, setStudents] = useState<Student[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)

  const [name, setName] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [addingStudent, setAddingStudent] = useState(false)

  const loadStudents = useCallback(async () => {
    setStudentsLoading(true)

    try {
      const response = await fetch('/api/admin-students', {
        method: 'GET',
        cache: 'no-store',
      })

      const data = await response.json()

      if (response.status === 401) {
        setIsAdmin(false)
        return
      }

      if (response.ok && data.success) {
        setStudents(data.students ?? [])
      }
    } catch {
      // نبقي القائمة كما هي إذا فشل الاتصال مؤقتاً
    } finally {
      setStudentsLoading(false)
    }
  }, [])

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/admin-session', {
          method: 'GET',
          cache: 'no-store',
        })

        const data = await response.json()

        if (response.ok && data.success) {
          setIsAdmin(true)
        }
      } catch {
        setIsAdmin(false)
      } finally {
        setCheckingSession(false)
      }
    }

    checkSession()
  }, [])

  useEffect(() => {
    if (isAdmin) {
      loadStudents()
    }
  }, [isAdmin, loadStudents])

  const login = async () => {
    if (!password) {
      setLoginError('أدخل كلمة مرور الإدارة')
      return
    }

    setLoginLoading(true)
    setLoginError('')

    try {
      const response = await fetch('/api/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setLoginError(
          data.message || 'كلمة المرور غير صحيحة'
        )
        return
      }

      setPassword('')
      setIsAdmin(true)
    } catch {
      setLoginError('تعذر الاتصال، حاول مرة أخرى')
    } finally {
      setLoginLoading(false)
    }
  }

  const addStudent = async () => {
    if (!name.trim()) {
      setFormError('أدخل اسم الطالب')
      return
    }

    if (!accessCode.trim()) {
      setFormError('أدخل كود الطالب')
      return
    }

    if (accessCode.trim().length < 6) {
      setFormError('الكود يجب أن يكون 6 خانات على الأقل')
      return
    }

    setAddingStudent(true)
    setFormError('')
    setFormSuccess('')

    try {
      const response = await fetch('/api/admin-students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          accessCode: accessCode.trim(),
          expiresAt: expiresAt || null,
        }),
      })

      const data = await response.json()

      if (response.status === 401) {
        setIsAdmin(false)
        return
      }

      if (!response.ok || !data.success) {
        setFormError(
          data.message || 'تعذر إضافة الطالب'
        )
        return
      }

      setName('')
      setAccessCode('')
      setExpiresAt('')
      setFormSuccess('تمت إضافة الطالب بنجاح ✅')

      await loadStudents()
    } catch {
      setFormError('تعذر الاتصال، حاول مرة أخرى')
    } finally {
      setAddingStudent(false)
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) {
      return 'بدون تاريخ انتهاء'
    }

    return new Intl.DateTimeFormat('ar-IQ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(date))
  }

  if (checkingSession) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-black px-4 text-white"
      >
        <div className="text-center">
          <div className="text-4xl">🔐</div>

          <p className="mt-4 text-zinc-400">
            جاري التحقق من جلسة الإدارة...
          </p>
        </div>
      </main>
    )
  }

  if (!isAdmin) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-black px-4 text-white"
      >
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="text-center">
            <div className="text-4xl">🔐</div>

            <h1 className="mt-4 text-3xl font-bold">
              لوحة الإدارة
            </h1>

            <p className="mt-3 text-zinc-400">
              خاصة بالأستاذ حيدر محمد
            </p>
          </div>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                login()
              }
            }}
            placeholder="كلمة مرور الإدارة"
            autoComplete="current-password"
            disabled={loginLoading}
            className="mt-7 w-full rounded-xl border border-zinc-700 bg-black px-4 py-4 text-center text-lg outline-none focus:border-yellow-400 disabled:opacity-50"
          />

          {loginError && (
            <p className="mt-3 text-center text-sm text-red-400">
              {loginError}
            </p>
          )}

          <button
            type="button"
            onClick={login}
            disabled={loginLoading}
            className="mt-4 w-full rounded-xl bg-yellow-400 px-4 py-4 text-lg font-bold text-black disabled:opacity-50"
          >
            {loginLoading
              ? 'جاري التحقق...'
              : 'دخول لوحة الإدارة'}
          </button>
        </div>
      </main>
    )
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-black px-4 py-8 text-white"
    >
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-yellow-400/30 bg-zinc-950 p-6">
          <p className="text-sm font-bold text-yellow-400">
            لوحة الإدارة
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            أهلاً أستاذ حيدر 👋
          </h1>

          <p className="mt-3 text-zinc-400">
            إدارة طلاب الخاص والاشتراكات.
          </p>
        </div>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-2xl font-bold">
            إضافة طالب جديد
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                اسم الطالب
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: أحمد محمد"
                className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                كود الاشتراك
              </label>

              <input
                type="text"
                value={accessCode}
                onChange={(e) =>
                  setAccessCode(e.target.value)
                }
                placeholder="6 خانات أو أكثر"
                className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                انتهاء الاشتراك
              </label>

              <input
                type="date"
                value={expiresAt}
                onChange={(e) =>
                  setExpiresAt(e.target.value)
                }
                className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
              />
            </div>
          </div>

          {formError && (
            <p className="mt-4 text-sm text-red-400">
              {formError}
            </p>
          )}

          {formSuccess && (
            <p className="mt-4 text-sm text-green-400">
              {formSuccess}
            </p>
          )}

          <button
            type="button"
            onClick={addStudent}
            disabled={addingStudent}
            className="mt-5 w-full rounded-xl bg-yellow-400 px-5 py-4 font-bold text-black disabled:opacity-50 md:w-auto"
          >
            {addingStudent
              ? 'جاري الإضافة...'
              : 'إضافة الطالب'}
          </button>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">
                طلاب الخاص
              </h2>

              <p className="mt-1 text-sm text-zinc-400">
                العدد: {students.length}
              </p>
            </div>

            <button
              type="button"
              onClick={loadStudents}
              disabled={studentsLoading}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold disabled:opacity-50"
            >
              تحديث
            </button>
          </div>

          {studentsLoading && students.length === 0 ? (
            <p className="mt-6 text-zinc-400">
              جاري تحميل الطلاب...
            </p>
          ) : students.length === 0 ? (
            <p className="mt-6 text-zinc-400">
              لا يوجد طلاب حالياً.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="rounded-xl border border-zinc-800 bg-black p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold">
                        {student.name}
                      </h3>

                      <p className="mt-1 text-sm text-zinc-400">
                        الكود: {student.access_code}
                      </p>

                      <p className="mt-1 text-sm text-zinc-500">
                        الانتهاء:{' '}
                        {formatDate(student.expires_at)}
                      </p>
                    </div>

                    <div>
                      <span
                        className={
                          student.is_active
                            ? 'inline-block rounded-full bg-green-500/10 px-3 py-1 text-sm font-bold text-green-400'
                            : 'inline-block rounded-full bg-red-500/10 px-3 py-1 text-sm font-bold text-red-400'
                        }
                      >
                        {student.is_active
                          ? 'فعال'
                          : 'متوقف'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}