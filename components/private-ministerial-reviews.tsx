'use client'

import { useEffect, useState } from 'react'

type Review = {
  id: number
  chapter: string
  topic: string
  lecture_title: string
  video_url: string
  chapter_order: number
  topic_order: number
  lecture_order: number
}

type View =
  | { type: 'chapters' }
  | { type: 'topics'; chapter: string }
  | {
      type: 'lectures'
      chapter: string
      topic: string
    }

export default function PrivateMinisterialReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [view, setView] = useState<View>({
    type: 'chapters',
  })

  useEffect(() => {
    const loadReviews = async () => {
      setLoading(true)
      setError('')

      try {
        const deviceId = localStorage.getItem(
          'private_student_device_id'
        )

        if (!deviceId) {
          setError('تعذر التحقق من الجهاز')
          return
        }

        const response = await fetch(
          '/api/private-ministerial-reviews',
          {
            method: 'GET',
            cache: 'no-store',
            headers: {
              'x-device-id': deviceId,
            },
          }
        )

        const data = await response.json()

        if (!response.ok || !data.success) {
          setError(
            data.error ||
              'تعذر تحميل مراجعة الأسئلة الوزارية'
          )
          return
        }

        setReviews(data.reviews ?? [])
      } catch {
        setError('تعذر الاتصال بالخادم')
      } finally {
        setLoading(false)
      }
    }

    loadReviews()
  }, [])

  const chapters = Array.from(
    new Map(
      reviews.map((review) => [
        review.chapter,
        {
          name: review.chapter,
          order: review.chapter_order,
        },
      ])
    ).values()
  ).sort((a, b) => a.order - b.order)

  const getTopics = (chapter: string) => {
    return Array.from(
      new Map(
        reviews
          .filter(
            (review) => review.chapter === chapter
          )
          .map((review) => [
            review.topic,
            {
              name: review.topic,
              order: review.topic_order,
            },
          ])
      ).values()
    ).sort((a, b) => a.order - b.order)
  }

  const getLectures = (
    chapter: string,
    topic: string
  ) => {
    return reviews
      .filter(
        (review) =>
          review.chapter === chapter &&
          review.topic === topic
      )
      .sort(
        (a, b) =>
          a.lecture_order - b.lecture_order
      )
  }

  if (loading) {
    return (
      <div
        dir="rtl"
        className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center"
      >
        <div className="text-4xl">📚</div>

        <p className="mt-4 text-zinc-400">
          جاري تحميل مراجعة الأسئلة الوزارية...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div
        dir="rtl"
        className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center"
      >
        <div className="text-4xl">⚠️</div>

        <p className="mt-4 text-red-400">
          {error}
        </p>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div
        dir="rtl"
        className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center"
      >
        <div className="text-5xl">📚</div>

        <h2 className="mt-4 text-xl font-bold">
          مراجعة الأسئلة الوزارية
        </h2>

        <p className="mt-2 text-zinc-400">
          لم تتم إضافة محاضرات المراجعة بعد.
        </p>
      </div>
    )
  }

  if (view.type === 'chapters') {
    return (
      <section dir="rtl">
        <div className="rounded-2xl border border-yellow-400/30 bg-zinc-950 p-5">
          <div className="text-4xl">📚</div>

          <h2 className="mt-3 text-2xl font-bold">
            مراجعة الأسئلة الوزارية
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            اختر الفصل الذي تريد مراجعته
          </p>
        </div>

        <div className="mt-5 grid gap-3">
          {chapters.map((chapter, index) => (
            <button
              key={chapter.name}
              type="button"
              onClick={() =>
                setView({
                  type: 'topics',
                  chapter: chapter.name,
                })
              }
              className="flex w-full items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-right transition active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400 text-lg font-black text-black">
                  {index + 1}
                </div>

                <div>
                  <p className="text-lg font-bold">
                    {chapter.name}
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    اضغط لعرض مواضيع الفصل
                  </p>
                </div>
              </div>

              <span className="text-xl text-yellow-400">
                ←
              </span>
            </button>
          ))}
        </div>
      </section>
    )
  }

  if (view.type === 'topics') {
    const topics = getTopics(view.chapter)

    return (
      <section dir="rtl">
        <button
          type="button"
          onClick={() =>
            setView({ type: 'chapters' })
          }
          className="mb-4 rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold text-zinc-300"
        >
          → رجوع إلى الفصول
        </button>

        <div className="rounded-2xl border border-yellow-400/30 bg-zinc-950 p-5">
          <p className="text-sm font-bold text-yellow-400">
            مراجعة الأسئلة الوزارية
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            {view.chapter}
          </h2>

          <p className="mt-2 text-sm text-zinc-400">
            اختر الموضوع
          </p>
        </div>

        <div className="mt-5 grid gap-3">
          {topics.map((topic) => {
            const lectureCount = getLectures(
              view.chapter,
              topic.name
            ).length

            return (
              <button
                key={topic.name}
                type="button"
                onClick={() =>
                  setView({
                    type: 'lectures',
                    chapter: view.chapter,
                    topic: topic.name,
                  })
                }
                className="flex w-full items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-right transition active:scale-[0.98]"
              >
                <div>
                  <h3 className="text-lg font-bold">
                    {topic.name}
                  </h3>

                  <p className="mt-1 text-sm text-zinc-500">
                    {lectureCount} محاضرة
                  </p>
                </div>

                <span className="text-xl text-yellow-400">
                  ←
                </span>
              </button>
            )
          })}
        </div>
      </section>
    )
  }

  const lectures = getLectures(
    view.chapter,
    view.topic
  )

  return (
    <section dir="rtl">
      <button
        type="button"
        onClick={() =>
          setView({
            type: 'topics',
            chapter: view.chapter,
          })
        }
        className="mb-4 rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold text-zinc-300"
      >
        → رجوع إلى المواضيع
      </button>

      <div className="rounded-2xl border border-yellow-400/30 bg-zinc-950 p-5">
        <p className="text-sm font-bold text-yellow-400">
          {view.chapter}
        </p>

        <h2 className="mt-2 text-2xl font-bold">
          {view.topic}
        </h2>

        <p className="mt-2 text-sm text-zinc-400">
          محاضرات الأسئلة الوزارية
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {lectures.map((lecture, index) => (
          <a
            key={lecture.id}
            href={lecture.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl border border-zinc-800 bg-zinc-950 p-5 transition active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-2xl">
                ▶️
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-yellow-400">
                  السؤال {index + 1}
                </p>

                <h3 className="mt-1 font-bold">
                  {lecture.lecture_title}
                </h3>

                <p className="mt-2 text-xs text-zinc-500">
                  اضغط لمشاهدة الشرح
                </p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}