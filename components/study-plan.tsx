'use client'

import { useEffect, useMemo, useState } from 'react'

type StudyTask = {
  id: number
  plan_name: string
  day_number: number
  title: string
  description: string | null
  task_type: string
  task_url: string | null
  sort_order: number
  completed: boolean
}

function getStudyPlanDeviceId() {
  if (typeof window === 'undefined') return ''

  const key = 'study_plan_device_id'
  let deviceId = localStorage.getItem(key)

  if (!deviceId) {
    deviceId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`

    localStorage.setItem(key, deviceId)
  }

  return deviceId
}

function taskTypeLabel(type: string) {
  if (type === 'lecture') return '🎥 محاضرة'
  if (type === 'quiz') return '📝 اختبار'
  if (type === 'homework') return '✏️ واجب'
  if (type === 'review') return '📚 مراجعة'

  return '🎯 دراسة'
}

export default function StudyPlan() {
  const [tasks, setTasks] = useState<StudyTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState<number | null>(
    null
  )

  const loadPlan = async () => {
    setLoading(true)
    setError('')

    try {
      const deviceId = getStudyPlanDeviceId()

      const response = await fetch('/api/study-plan', {
        method: 'GET',
        headers: {
          'x-device-id': deviceId,
        },
        cache: 'no-store',
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(
          data.error || 'تعذر تحميل الخطة الدراسية'
        )
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
    loadPlan()
  }, [])

  const completedCount = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks]
  )

  const progress =
    tasks.length > 0
      ? Math.round((completedCount / tasks.length) * 100)
      : 0

  const groupedTasks = useMemo(() => {
    return tasks.reduce<Record<number, StudyTask[]>>(
      (groups, task) => {
        if (!groups[task.day_number]) {
          groups[task.day_number] = []
        }

        groups[task.day_number].push(task)
        return groups
      },
      {}
    )
  }, [tasks])

  const toggleCompleted = async (task: StudyTask) => {
    if (updatingId !== null) return

    setUpdatingId(task.id)
    setError('')

    const newValue = !task.completed

    try {
      const deviceId = getStudyPlanDeviceId()

      const response = await fetch('/api/study-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': deviceId,
        },
        body: JSON.stringify({
          taskId: task.id,
          completed: newValue,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(
          data.error || 'تعذر تحديث إنجاز المهمة'
        )
        return
      }

      setTasks((current) =>
        current.map((item) =>
          item.id === task.id
            ? { ...item, completed: newValue }
            : item
        )
      )
    } catch {
      setError('تعذر الاتصال بالخادم')
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return (
      <section
        dir="rtl"
        className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
      >
        <p className="text-center text-zinc-400">
          جاري تحميل الخطة الدراسية...
        </p>
      </section>
    )
  }

  if (error && tasks.length === 0) {
    return (
      <section
        dir="rtl"
        className="rounded-2xl border border-red-500/30 bg-zinc-950 p-6"
      >
        <p className="text-center text-red-400">
          {error}
        </p>

        <button
          type="button"
          onClick={loadPlan}
          className="mt-4 w-full rounded-xl bg-yellow-400 px-4 py-3 font-bold text-black"
        >
          إعادة المحاولة
        </button>
      </section>
    )
  }

  if (tasks.length === 0) {
    return (
      <section
        dir="rtl"
        className="rounded-2xl border border-yellow-400/20 bg-zinc-950 p-6"
      >
        <h2 className="text-xl font-bold text-yellow-400">
          📅 الخطة الدراسية
        </h2>

        <p className="mt-3 text-zinc-400">
          سيتم إضافة الخطة الدراسية قريباً.
        </p>
      </section>
    )
  }

  return (
    <section
      dir="rtl"
      className="rounded-2xl border border-yellow-400/30 bg-zinc-950 p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-bold text-yellow-400">
            📅 خطتك الدراسية
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            {tasks[0]?.plan_name || 'خطة 30 يوم'}
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            أنجز مهامك اليومية واضغط على علامة الإنجاز
            بعد إكمال كل مهمة.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-black p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-zinc-400">
                نسبة الإنجاز
              </p>

              <p className="mt-1 text-3xl font-black text-yellow-400">
                {progress}%
              </p>
            </div>

            <div className="text-left">
              <p className="text-sm text-zinc-400">
                المهام المكتملة
              </p>

              <p className="mt-1 font-bold">
                {completedCount} من {tasks.length}
              </p>
            </div>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-yellow-400 transition-all duration-300"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          {progress === 100 && (
            <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-center font-bold text-green-400">
              🎉 أحسنت! أكملت جميع مهام الخطة.
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {Object.entries(groupedTasks)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([day, dayTasks]) => {
            const dayCompleted = dayTasks.every(
              (task) => task.completed
            )

            return (
              <div
                key={day}
                className="overflow-hidden rounded-2xl border border-zinc-800 bg-black"
              >
                <div className="flex items-center justify-between gap-3 border-b border-zinc-800 p-4">
                  <div>
                    <p className="text-lg font-bold">
                      اليوم {day}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {
                        dayTasks.filter(
                          (task) => task.completed
                        ).length
                      }{' '}
                      من {dayTasks.length} مهام
                    </p>
                  </div>

                  {dayCompleted && (
                    <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm font-bold text-green-400">
                      ✓ مكتمل
                    </span>
                  )}
                </div>

                <div className="space-y-3 p-4">
                  {dayTasks
                    .sort(
                      (a, b) =>
                        a.sort_order - b.sort_order
                    )
                    .map((task) => (
                      <div
                        key={task.id}
                        className={`rounded-xl border p-4 transition ${
                          task.completed
                            ? 'border-green-500/30 bg-green-500/5'
                            : 'border-zinc-800 bg-zinc-950'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              toggleCompleted(task)
                            }
                            disabled={
                              updatingId === task.id
                            }
                            aria-label={
                              task.completed
                                ? 'إلغاء إنجاز المهمة'
                                : 'تحديد المهمة كمكتملة'
                            }
                            className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 font-black transition ${
                              task.completed
                                ? 'border-green-400 bg-green-400 text-black'
                                : 'border-zinc-600 text-transparent'
                            } disabled:opacity-50`}
                          >
                            ✓
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3
                                className={`font-bold ${
                                  task.completed
                                    ? 'text-zinc-500 line-through'
                                    : 'text-white'
                                }`}
                              >
                                {task.title}
                              </h3>

                              <span className="rounded-full border border-zinc-700 px-2 py-1 text-xs text-zinc-400">
                                {taskTypeLabel(
                                  task.task_type
                                )}
                              </span>
                            </div>

                            {task.description && (
                              <p className="mt-2 text-sm leading-6 text-zinc-400">
                                {task.description}
                              </p>
                            )}

                            {task.task_url && (
                              <a
                                href={task.task_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-block rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-black"
                              >
                                فتح المهمة
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )
          })}
      </div>
    </section>
  )
}