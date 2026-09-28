'use client'

import { FormEvent, useEffect, useState } from 'react'

type BasicLesson = {
  id: number
  created_at: string
  topic: string
  lecture_title: string
  video_url: string
  topic_order: number
  lecture_order: number
  is_active: boolean
}

const emptyForm = {
  topic: '',
  lectureTitle: '',
  videoUrl: '',
  topicOrder: '0',
  lectureOrder: '0',
}

export default function AdminBasicLessons() {
  const [lessons, setLessons] = useState<BasicLesson[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function loadLessons() {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin-basic-lessons', {
        cache: 'no-store',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'تعذر جلب المحاضرات')
      }

      setLessons(data.lessons || [])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء جلب المحاضرات'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLessons()
  }, [])

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
    setMessage('')
    setError('')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    setSaving(true)
    setMessage('')
    setError('')

    try {
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        topic: form.topic.trim(),
        lectureTitle: form.lectureTitle.trim(),
        videoUrl: form.videoUrl.trim(),
        topicOrder: Number(form.topicOrder),
        lectureOrder: Number(form.lectureOrder),
      }

      const response = await fetch('/api/admin-basic-lessons', {
        method: editingId ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'تعذر حفظ المحاضرة')
      }

      setMessage(
        editingId
          ? 'تم تعديل المحاضرة بنجاح'
          : 'تمت إضافة المحاضرة بنجاح'
      )

      setForm(emptyForm)
      setEditingId(null)

      await loadLessons()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء حفظ المحاضرة'
      )
    } finally {
      setSaving(false)
    }
  }

  function startEditing(lesson: BasicLesson) {
    setEditingId(lesson.id)

    setForm({
      topic: lesson.topic,
      lectureTitle: lesson.lecture_title,
      videoUrl: lesson.video_url,
      topicOrder: String(lesson.topic_order),
      lectureOrder: String(lesson.lecture_order),
    })

    setMessage('')
    setError('')

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  async function toggleVisibility(lesson: BasicLesson) {
    setMessage('')
    setError('')

    try {
      const response = await fetch('/api/admin-basic-lessons', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: lesson.id,
          isActive: !lesson.is_active,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'تعذر تغيير حالة المحاضرة')
      }

      await loadLessons()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء تغيير حالة المحاضرة'
      )
    }
  }

  async function deleteLesson(lesson: BasicLesson) {
    const confirmed = window.confirm(
      `هل تريد حذف المحاضرة "${lesson.lecture_title}" نهائيًا؟`
    )

    if (!confirmed) return

    setMessage('')
    setError('')

    try {
      const response = await fetch('/api/admin-basic-lessons', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: lesson.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'تعذر حذف المحاضرة')
      }

      if (editingId === lesson.id) {
        resetForm()
      }

      setMessage('تم حذف المحاضرة')
      await loadLessons()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء حذف المحاضرة'
      )
    }
  }

  return (
    <section
      dir="rtl"
      className="mt-8 rounded-3xl border border-yellow-400/20 bg-zinc-950 p-5 sm:p-7"
    >
      <div className="mb-6">
        <p className="text-sm font-bold text-yellow-400">
          إدارة المحتوى
        </p>

        <h2 className="mt-1 text-2xl font-black text-white">
          📐 شرح الأساسيات
        </h2>

        <p className="mt-2 text-sm leading-6 text-zinc-400">
          أضف مواضيع ومحاضرات الأساسيات التي تظهر لطلاب الخاص.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-zinc-800 bg-black p-4"
      >
        <h3 className="mb-4 text-lg font-bold text-white">
          {editingId ? 'تعديل المحاضرة' : 'إضافة محاضرة جديدة'}
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-zinc-300">
              اسم الموضوع
            </span>

            <input
              required
              value={form.topic}
              onChange={(event) =>
                setForm({
                  ...form,
                  topic: event.target.value,
                })
              }
              placeholder="مثال: قوانين الإشارات"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-yellow-400"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-zinc-300">
              عنوان المحاضرة
            </span>

            <input
              required
              value={form.lectureTitle}
              onChange={(event) =>
                setForm({
                  ...form,
                  lectureTitle: event.target.value,
                })
              }
              placeholder="مثال: شرح قوانين الإشارات"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-yellow-400"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-bold text-zinc-300">
              رابط YouTube
            </span>

            <input
              required
              type="url"
              value={form.videoUrl}
              onChange={(event) =>
                setForm({
                  ...form,
                  videoUrl: event.target.value,
                })
              }
              placeholder="https://youtube.com/..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-left text-white outline-none focus:border-yellow-400"
              dir="ltr"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-zinc-300">
              ترتيب الموضوع
            </span>

            <input
              required
              min="0"
              type="number"
              value={form.topicOrder}
              onChange={(event) =>
                setForm({
                  ...form,
                  topicOrder: event.target.value,
                })
              }
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-yellow-400"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-zinc-300">
              ترتيب المحاضرة
            </span>

            <input
              required
              min="0"
              type="number"
              value={form.lectureOrder}
              onChange={(event) =>
                setForm({
                  ...form,
                  lectureOrder: event.target.value,
                })
              }
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-yellow-400"
            />
          </label>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-300">
            {message}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-yellow-400 px-6 py-3 font-black text-black disabled:opacity-50"
          >
            {saving
              ? 'جاري الحفظ...'
              : editingId
                ? 'حفظ التعديلات'
                : 'إضافة المحاضرة'}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-zinc-700 px-6 py-3 font-bold text-zinc-300"
            >
              إلغاء التعديل
            </button>
          )}
        </div>
      </form>

      <div className="mt-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-white">
            المحاضرات المضافة
          </h3>

          <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs text-zinc-400">
            {lessons.length} محاضرة
          </span>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-zinc-800 p-6 text-center text-zinc-400">
            جاري تحميل المحاضرات...
          </div>
        ) : lessons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-700 p-7 text-center text-zinc-500">
            لم تتم إضافة محاضرات أساسيات بعد.
          </div>
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson) => (
              <article
                key={lesson.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-400">
                        {lesson.topic}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          lesson.is_active
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {lesson.is_active ? 'ظاهر للطلاب' : 'مخفي'}
                      </span>
                    </div>

                    <h4 className="mt-3 text-lg font-bold text-white">
                      {lesson.lecture_title}
                    </h4>

                    <p className="mt-2 text-xs text-zinc-500">
                      ترتيب الموضوع: {lesson.topic_order}
                      {' • '}
                      ترتيب المحاضرة: {lesson.lecture_order}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <a
                      href={lesson.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-black text-black"
                    >
                      فتح الفيديو
                    </a>

                    <button
                      type="button"
                      onClick={() => startEditing(lesson)}
                      className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-bold text-white"
                    >
                      تعديل
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleVisibility(lesson)}
                      className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-bold text-zinc-300"
                    >
                      {lesson.is_active ? 'إخفاء' : 'إظهار'}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteLesson(lesson)}
                      className="rounded-lg border border-red-500/40 px-4 py-2 text-sm font-bold text-red-400"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}