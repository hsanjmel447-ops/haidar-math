'use client'

import { useState } from 'react'

type Student = {
  id: number
  name: string
}

export default function PrivateStudentsPage() {
  const [code, setCode] = useState('')
  const [student, setStudent] = useState<Student | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const enterPrivateArea = async () => {
    if (!code.trim()) {
      setError('أدخل كود الاشتراك')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/private-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.message || 'تعذر تسجيل الدخول')
        return
      }

      setStudent(data.student)
    } catch {
      setError('تعذر الاتصال، حاول مرة أخرى')
    } finally {
      setLoading(false)
    }
  }

  if (student) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-black px-4 py-12 text-white"
      >
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-yellow-400/30 bg-zinc-950 p-6">
            <p className="text-sm font-bold text-yellow-400">
              منطقة حصرية لطلاب الخاص
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              أهلاً {student.name} 🎓
            </h1>

            <p className="mt-4 text-zinc-400">
              تم تسجيل دخولك بنجاح. هنا ستتوفر محاضرات الخاص
              والاختبارات والواجبات والملفات الحصرية.
            </p>

            <button
              type="button"
              onClick={() => {
                setStudent(null)
                setCode('')
              }}
              className="mt-7 rounded-xl border border-zinc-700 px-5 py-3 font-bold"
            >
              تسجيل الخروج
            </button>
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
          {loading ? 'جاري التحقق...' : 'دخول طلاب الخاص'}
        </button>

        <p className="mt-5 text-center text-xs text-zinc-500">
          هذه المنطقة مخصصة لطلاب الأستاذ حيدر محمد المشتركين
        </p>
      </div>
    </main>
  )
}