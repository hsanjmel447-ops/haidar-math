'use client'

import { useEffect, useState } from 'react'

type StudyTask = {
  id: number
  plan_name: string
  day_number: number
  title: string
  description: string | null
  task_type: string
  task_url: string | null
  sort_order: number
  is_active: boolean
}

export default function AdminStudyPlan() {
  const [tasks, setTasks] = useState<StudyTask[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [planName, setPlanName] = useState('خطة 30 يوم')
  const [dayNumber, setDayNumber] = useState('1')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [taskType, setTaskType] = useState('study')
  const [taskUrl, setTaskUrl] = useState('')
  const [sortOrder, setSortOrder] = useState('1')

  const loadTasks = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin-study-plan', {
        method: 'GET',
        cache: 'no-store',
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'تعذر تحميل الخطة الدراسية')
        return
      }

      setTasks(data.tasks ?? [])
    } catch {
      setError('تعذر الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  const addTask = async () => {
    if (!title.trim()) {
      setError('اكتب عنوان المهمة')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/admin-study-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planName: planName.trim(),
          dayNumber: Number(dayNumber),
          title: title.trim(),
          description: description.trim(),
          taskType,
          taskUrl: taskUrl.trim(),
          sortOrder: Number(sortOrder),
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'تعذر إضافة المهمة')
        return
      }

      setTitle('')
      setDescription('')
      setTaskUrl('')
      setSortOrder((current) =>
        String(Number(current || 0) + 1)
      )

      setMessage('تمت إضافة المهمة بنجاح')
      await loadTasks()
    } catch {
      setError('تعذر الاتصال بالخادم')
    } finally {
      setSaving(false)
    }
  }

  const toggleTask = async (task: StudyTask) => {
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/admin-study-plan', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: task.id,
          isActive: !task.is_active,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'تعذر تحديث المهمة')
        return
      }

      setTasks((current) =>
        current.map((item) =>
          item.id === task.id
            ? { ...item, is_active: !item.is_active }
            : item
        )
      )
    } catch {
      setError('تعذر الاتصال بالخادم')
    }
  }

  const deleteTask = async (task: StudyTask) => {
    const confirmed = window.confirm(
      `هل تريد حذف المهمة "${task.title}"؟`
    )

    if (!confirmed) {
      return
    }

    setError('')
    setMessage('')

    try {
      const response = await fetch(
        `/api/admin-study-plan?taskId=${task.id}`,
        {
          method: 'DELETE',
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'تعذر حذف المهمة')
        return
      }

      setTasks((current) =>
        current.filter((item) => item.id !== task.id)
      )

      setMessage('تم حذف المهمة')
    } catch {
      setError('تعذر الاتصال بالخادم')
    }
  }

  const taskTypeLabel = (type: string) => {
    if (type === 'lecture') return '🎥 محاضرة'
    if (type === 'quiz') return '📝 اختبار'
    if (type === 'homework') return '✏️ واجب'
    if (type === 'review') return '📚 مراجعة'

    return '🎯 دراسة'
  }

  const groupedTasks = tasks.reduce<
    Record<string, Record<number, StudyTask[]>>
  >((groups, task) => {
    const plan = task.plan_name || 'خطة 30 يوم'

    if (!groups[plan]) {
      groups[plan] = {}
    }

    if (!groups[plan][task.day_number]) {
      groups[plan][task.day_number] = []
    }

    groups[plan][task.day_number].push(task)

    return groups
  }, {})

  return (
    <section className="mt-8 rounded-2xl border border-yellow-400/30 bg-zinc-950 p-6">
      <div>
        <p className="text-sm font-bold text-yellow-400">
          📅 الخطة الدراسية
        </p>

        <h2 className="mt-2 text-2xl font-bold">
          إدارة الخطط والمهام
        </h2>

        <p className="mt-2 text-sm leading-6 text-zinc-400">
          أضف مهام كل يوم وحدد نوع المهمة والرابط الخاص بها.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm text-zinc-400">
            اسم الخطة
          </label>

          <input
            type="text"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="خطة 30 يوم"
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
          />
        </div>

        <div>
          <label className="text-sm text-zinc-400">
            رقم اليوم
          </label>

          <input
            type="number"
            min="1"
            value={dayNumber}
            onChange={(e) => setDayNumber(e.target.value)}
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm text-zinc-400">
            عنوان المهمة
          </label>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثلاً: شاهد محاضرة الدائرة الأولى"
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
          />
        </div>

        <div>
          <label className="text-sm text-zinc-400">
            نوع المهمة
          </label>

          <select
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
          >
            <option value="study">🎯 دراسة</option>
            <option value="lecture">🎥 محاضرة</option>
            <option value="quiz">📝 اختبار</option>
            <option value="homework">✏️ واجب</option>
            <option value="review">📚 مراجعة</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-zinc-400">
            ترتيب المهمة
          </label>

          <input
            type="number"
            min="0"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm text-zinc-400">
            رابط المهمة — اختياري
          </label>

          <input
            type="url"
            value={taskUrl}
            onChange={(e) => setTaskUrl(e.target.value)}
            placeholder="رابط المحاضرة أو الاختبار"
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm text-zinc-400">
            وصف المهمة — اختياري
          </label>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="تعليمات أو ملاحظات للطالب"
            rows={3}
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {message && (
        <p className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={addTask}
        disabled={saving}
        className="mt-5 w-full rounded-xl bg-yellow-400 px-5 py-4 font-bold text-black disabled:opacity-50"
      >
        {saving ? 'جاري الإضافة...' : 'إضافة المهمة'}
      </button>

      <div className="mt-8 border-t border-zinc-800 pt-6">
        <h3 className="text-xl font-bold">
          المهام المضافة
        </h3>

        {loading ? (
          <p className="mt-4 text-zinc-400">
            جاري تحميل المهام...
          </p>
        ) : tasks.length === 0 ? (
          <div className="mt-4 rounded-xl border border-zinc-800 bg-black p-5 text-center">
            <p className="text-zinc-400">
              لم تتم إضافة أي مهام حتى الآن.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-6">
            {Object.entries(groupedTasks).map(
              ([plan, days]) => (
                <div
                  key={plan}
                  className="rounded-2xl border border-yellow-400/20 bg-black p-5"
                >
                  <h4 className="text-xl font-bold text-yellow-400">
                    {plan}
                  </h4>

                  <div className="mt-5 space-y-5">
                    {Object.entries(days).map(
                      ([day, dayTasks]) => (
                        <div
                          key={day}
                          className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                        >
                          <h5 className="font-bold">
                            اليوم {day}
                          </h5>

                          <div className="mt-3 space-y-3">
                            {dayTasks
                              .sort(
                                (a, b) =>
                                  a.sort_order -
                                  b.sort_order
                              )
                              .map((task) => (
                                <div
                                  key={task.id}
                                  className="rounded-xl border border-zinc-800 bg-black p-4"
                                >
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-bold">
                                          {task.title}
                                        </p>

                                        <span className="rounded-full border border-zinc-700 px-2 py-1 text-xs text-zinc-400">
                                          {taskTypeLabel(
                                            task.task_type
                                          )}
                                        </span>

                                        <span
                                          className={`rounded-full px-2 py-1 text-xs ${
                                            task.is_active
                                              ? 'bg-green-500/10 text-green-400'
                                              : 'bg-red-500/10 text-red-400'
                                          }`}
                                        >
                                          {task.is_active
                                            ? 'مفعلة'
                                            : 'مخفية'}
                                        </span>
                                      </div>

                                      {task.description && (
                                        <p className="mt-2 text-sm leading-6 text-zinc-400">
                                          {task.description}
                                        </p>
                                      )}

                                      <p className="mt-2 text-xs text-zinc-500">
                                        الترتيب:{' '}
                                        {task.sort_order}
                                      </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                      {task.task_url && (
                                        <a
                                          href={task.task_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="rounded-lg border border-zinc-700 px-3 py-2 text-sm"
                                        >
                                          فتح الرابط
                                        </a>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() =>
                                          toggleTask(task)
                                        }
                                        className="rounded-lg border border-yellow-400/40 px-3 py-2 text-sm font-bold text-yellow-400"
                                      >
                                        {task.is_active
                                          ? 'إخفاء'
                                          : 'تفعيل'}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          deleteTask(task)
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
                        </div>
                      )
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </section>
  )
}