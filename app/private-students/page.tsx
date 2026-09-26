'use client'

import { useState } from 'react'

export default function PrivateStudentsPage() {
  const [code, setCode] = useState('')
  const [access, setAccess] = useState(false)
  const [error, setError] = useState(false)

  const enterPrivateArea = () => {
    if (code === 'HM2026') {
      setAccess(true)
      setError(false)
    } else {
      setError(true)
    }
  }

  if (access) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-black px-4 py-12 text-white"
      >
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-yellow-400/30 bg-zinc-950 p-6">
            <p className="text-sm font-bold text-yellow-400">
              منطقة حصرية
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              أهلاً بك في طلاب الخاص 🎓
            </h1>

            <p className="mt-4 text-zinc-400">
              هنا ستتوفر محاضرات الخاص والاختبارات والواجبات
              والملفات الحصرية.
            </p>
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
            أدخل كود الاشتراك للوصول إلى المحتوى الخاص
          </p>
        </div>

        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="كود الاشتراك"
          className="mt-7 w-full rounded-xl border border-zinc-700 bg-black px-4 py-4 text-center text-lg outline-none focus:border-yellow-400"
        />

        {error && (
          <p className="mt-3 text-center text-sm text-red-400">
            كود الاشتراك غير صحيح
          </p>
        )}

        <button
          type="button"
          onClick={enterPrivateArea}
          className="mt-4 w-full rounded-xl bg-yellow-400 px-4 py-4 text-lg font-bold text-black"
        >
          دخول طلاب الخاص
        </button>

        <p className="mt-5 text-center text-xs text-zinc-500">
          هذه المنطقة مخصصة لطلاب الأستاذ حيدر محمد المشتركين
        </p>
      </div>
    </main>
  )
}