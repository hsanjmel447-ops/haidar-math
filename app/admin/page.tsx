'use client'

import { useEffect, useState } from 'react'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

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

  const login = async () => {
    if (!password) {
      setError('أدخل كلمة مرور الإدارة')
      return
    }

    setLoading(true)
    setError('')

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
        setError(data.message || 'كلمة المرور غير صحيحة')
        return
      }

      setPassword('')
      setIsAdmin(true)
    } catch {
      setError('تعذر الاتصال، حاول مرة أخرى')
    } finally {
      setLoading(false)
    }
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

  if (isAdmin) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-black px-4 py-10 text-white"
      >
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-yellow-400/30 bg-zinc-950 p-6">
            <p className="text-sm font-bold text-yellow-400">
              لوحة الإدارة
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              أهلاً أستاذ حيدر 👋
            </h1>

            <p className="mt-3 text-zinc-400">
              من هنا راح تدير طلاب الخاص والاشتراكات.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-sm text-zinc-400">
                الطلاب
              </p>

              <p className="mt-2 text-2xl font-bold">
                إدارة الطلاب
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                إضافة وتعديل وإيقاف اشتراكات الطلاب.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-sm text-zinc-400">
                الاشتراكات
              </p>

              <p className="mt-2 text-2xl font-bold">
                مدة الاشتراك
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                متابعة الاشتراكات الفعالة والمنتهية.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-sm text-zinc-400">
                النظام
              </p>

              <p className="mt-2 text-2xl font-bold">
                طلاب الخاص
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                إدارة منطقة المحتوى الخاص.
              </p>
            </div>
          </div>
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
          onClick={login}
          disabled={loading}
          className="mt-4 w-full rounded-xl bg-yellow-400 px-4 py-4 text-lg font-bold text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'جاري التحقق...' : 'دخول لوحة الإدارة'}
        </button>

        <p className="mt-5 text-center text-xs text-zinc-500">
          هذه الصفحة مخصصة لإدارة طلاب الخاص
        </p>
      </div>
    </main>
  )
}