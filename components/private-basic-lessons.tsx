'use client'

import { useEffect, useMemo, useState } from 'react'

type BasicLesson = {
  id: number
  topic: string
  lecture_title: string
  video_url: string
  topic_order: number
  lecture_order: number
}

export default function PrivateBasicLessons() {
  const [lessons, setLessons] = useState<BasicLesson[]>([])
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadLessons() {
      try {
        setLoading(true)
        setError('')

        const deviceId =
          localStorage.getItem('private_student_device_id') || ''

        const response = await fetch('/api/private-basic-lessons', {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'x-device-id': deviceId,
          },
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.error || 'تعذر تحميل محاضرات الأساسيات'
          )
        }

        setLessons(data.lessons || [])
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'حدث خطأ أثناء تحميل المحاضرات'
        )
      } finally {
        setLoading(false)
      }
    }

    loadLessons()
  }, [])

  const topics = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string
        order: number
        lessons: BasicLesson[]
      }
    >()

    for (const lesson of lessons) {
      const existing = map.get(lesson.topic)

      if (existing) {
        existing.lessons.push(lesson)

        if (lesson.topic_order < existing.order) {
          existing.order = lesson.topic_order
        }
      } else {
        map.set(lesson.topic, {
          name: lesson.topic,
          order: lesson.topic_order,
          lessons: [lesson],
        })
      }
    }

    return Array.from(map.values())
      .sort((a, b) => a.order - b.order)
      .map((topic) => ({
        ...topic,
        lessons: topic.lessons.sort(
          (a, b) =>
            a.lecture_order - b.lecture_order ||
            a.id - b.id
        ),
      }))
  }, [lessons])

  const currentTopic = topics.find(
    (topic) => topic.name === selectedTopic
  )

  if (loading) {
    return (
      <section
        dir="rtl"
        className="rounded-3xl border border-yellow-400/20 bg-zinc-950 p-6"
      >
        <div className="text-center text-zinc-400">
          جاري تحميل شرح الأساسيات...
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section
        dir="rtl"
        className="rounded-3xl border border-red-500/30 bg-zinc-950 p-6"
      >
        <div className="rounded-2xl bg-red-500/10 p-4 text-center text-red-300">
          {error}
        </div>
      </section>
    )
  }

  return (
    <section dir="rtl" className="space-y-5">
      <div className="rounded-3xl border border-yellow-400/20 bg-zinc-950 p-6">
        <div className="text-center">
          <div className="text-5xl">📐</div>

          <h2 className="mt-3 text-2xl font-black text-yellow-400">
            شرح الأساسيات
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            اختر الموضوع الذي تريد مراجعته
          </p>
        </div>
      </div>

      {topics.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950 p-8 text-center text-zinc-500">
          لا توجد محاضرات أساسيات متاحة حاليًا.
        </div>
      ) : !selectedTopic ? (
        <div className="space-y-3">
          {topics.map((topic, index) => (
            <button
              key={topic.name}
              type="button"
              onClick={() => setSelectedTopic(topic.name)}
              className="flex w-full items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-right transition hover:border-yellow-400/60 hover:bg-zinc-900"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-400 font-black text-black">
                  {index + 1}
                </div>

                <div>
                  <h3 className="text-lg font-black text-white">
                    {topic.name}
                  </h3>

                  <p className="mt-1 text-xs text-zinc-500">
                    {topic.lessons.length}{' '}
                    {topic.lessons.length === 1
                      ? 'محاضرة'
                      : 'محاضرات'}
                  </p>
                </div>
              </div>

              <span className="text-xl text-yellow-400">←</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setSelectedTopic(null)}
            className="rounded-xl border border-zinc-700 px-5 py-3 font-bold text-white"
          >
            ← رجوع للمواضيع
          </button>

          <div className="rounded-2xl border border-yellow-400/20 bg-zinc-950 p-5">
            <p className="text-xs font-bold text-yellow-400">
              الموضوع
            </p>

            <h3 className="mt-1 text-xl font-black text-white">
              {currentTopic?.name}
            </h3>
          </div>

          <div className="space-y-3">
            {currentTopic?.lessons.map((lesson, index) => (
              <article
                key={lesson.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-400/10 font-black text-yellow-400">
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-black leading-7 text-white">
                      {lesson.lecture_title}
                    </h4>

                    <a
                      href={lesson.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex rounded-xl bg-yellow-400 px-5 py-3 text-sm font-black text-black"
                    >
                      ▶ مشاهدة الشرح
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}