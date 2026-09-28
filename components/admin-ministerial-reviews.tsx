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
  is_active: boolean
}

export default function AdminMinisterialReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [chapter, setChapter] = useState('')
  const [topic, setTopic] = useState('')
  const [lectureTitle, setLectureTitle] = useState('')
  const [videoUrl, setVideoUrl] = useState('')

  const [chapterOrder, setChapterOrder] = useState('1')
  const [topicOrder, setTopicOrder] = useState('1')
  const [lectureOrder, setLectureOrder] = useState('1')

  const loadReviews = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        '/api/admin-ministerial-reviews',
        {
          method: 'GET',
          cache: 'no-store',
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

  useEffect(() => {
    loadReviews()
  }, [])

  const addReview = async () => {
    if (
      !chapter.trim() ||
      !topic.trim() ||
      !lectureTitle.trim() ||
      !videoUrl.trim()
    ) {
      setError(
        'أكمل الفصل والموضوع واسم المحاضرة ورابط يوتيوب'
      )
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(
        '/api/admin-ministerial-reviews',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chapter: chapter.trim(),
            topic: topic.trim(),
            lectureTitle: lectureTitle.trim(),
            videoUrl: videoUrl.trim(),
            chapterOrder: Number(chapterOrder),
            topicOrder: Number(topicOrder),
            lectureOrder: Number(lectureOrder),
            isActive: true,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(
          data.error || 'تعذر إضافة المحاضرة'
        )
        return
      }

      setLectureTitle('')
      setVideoUrl('')
      setLectureOrder((current) =>
        String(Number(current) + 1)
      )

      setSuccess('تمت إضافة المحاضرة بنجاح')
      await loadReviews()
    } catch {
      setError('تعذر الاتصال بالخادم')
    } finally {
      setSaving(false)
    }
  }

  const toggleReview = async (review: Review) => {
    setError('')
    setSuccess('')

    try {
      const response = await fetch(
        '/api/admin-ministerial-reviews',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: review.id,
            isActive: !review.is_active,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(
          data.error ||
            'تعذر تغيير حالة المحاضرة'
        )
        return
      }

      setSuccess(
        review.is_active
          ? 'تم إخفاء المحاضرة'
          : 'تم تفعيل المحاضرة'
      )

      await loadReviews()
    } catch {
      setError('تعذر الاتصال بالخادم')
    }
  }

  const editReview = async (review: Review) => {
    const newChapter = window.prompt(
      'اسم الفصل',
      review.chapter
    )

    if (newChapter === null) return

    const newTopic = window.prompt(
      'اسم الموضوع',
      review.topic
    )

    if (newTopic === null) return

    const newTitle = window.prompt(
      'اسم المحاضرة',
      review.lecture_title
    )

    if (newTitle === null) return

    const newUrl = window.prompt(
      'رابط المحاضرة',
      review.video_url
    )

    if (newUrl === null) return

    const newChapterOrder = window.prompt(
      'ترتيب الفصل',
      String(review.chapter_order)
    )

    if (newChapterOrder === null) return

    const newTopicOrder = window.prompt(
      'ترتيب الموضوع',
      String(review.topic_order)
    )

    if (newTopicOrder === null) return

    const newLectureOrder = window.prompt(
      'ترتيب المحاضرة',
      String(review.lecture_order)
    )

    if (newLectureOrder === null) return

    setError('')
    setSuccess('')

    try {
      const response = await fetch(
        '/api/admin-ministerial-reviews',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: review.id,
            chapter: newChapter,
            topic: newTopic,
            lectureTitle: newTitle,
            videoUrl: newUrl,
            chapterOrder: Number(newChapterOrder),
            topicOrder: Number(newTopicOrder),
            lectureOrder: Number(newLectureOrder),
          }),
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(
          data.error || 'تعذر تعديل المحاضرة'
        )
        return
      }

      setSuccess('تم تعديل المحاضرة بنجاح')
      await loadReviews()
    } catch {
      setError('تعذر الاتصال بالخادم')
    }
  }

  const deleteReview = async (review: Review) => {
    const confirmed = window.confirm(
      `هل تريد حذف "${review.lecture_title}" نهائياً؟`
    )

    if (!confirmed) return

    setError('')
    setSuccess('')

    try {
      const response = await fetch(
        `/api/admin-ministerial-reviews?id=${review.id}`,
        {
          method: 'DELETE',
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(
          data.error || 'تعذر حذف المحاضرة'
        )
        return
      }

      setSuccess('تم حذف المحاضرة')
      await loadReviews()
    } catch {
      setError('تعذر الاتصال بالخادم')
    }
  }

  const groupedReviews = reviews.reduce<
    Record<string, Record<string, Review[]>>
  >((groups, review) => {
    if (!groups[review.chapter]) {
      groups[review.chapter] = {}
    }

    if (!groups[review.chapter][review.topic]) {
      groups[review.chapter][review.topic] = []
    }

    groups[review.chapter][review.topic].push(review)

    return groups
  }, {})

  return (
    <section
      dir="rtl"
      className="mt-8 rounded-2xl border border-yellow-400/30 bg-zinc-950 p-5 text-white"
    >
      <div>
        <p className="text-sm font-bold text-yellow-400">
          إدارة المحتوى
        </p>

        <h2 className="mt-1 text-2xl font-bold">
          📚 مراجعة الأسئلة الوزارية
        </h2>

        <p className="mt-2 text-sm leading-6 text-zinc-400">
          أضف محاضرات المراجعة ورتبها حسب الفصل
          والموضوع.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-800 bg-black p-4">
        <h3 className="text-lg font-bold">
          إضافة محاضرة جديدة
        </h3>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={chapter}
            onChange={(e) =>
              setChapter(e.target.value)
            }
            placeholder="اسم الفصل - مثال: الفصل الأول"
            className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-yellow-400"
          />

          <input
            value={topic}
            onChange={(e) =>
              setTopic(e.target.value)
            }
            placeholder="اسم الموضوع - مثال: الدائرة"
            className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-yellow-400"
          />

          <input
            value={lectureTitle}
            onChange={(e) =>
              setLectureTitle(e.target.value)
            }
            placeholder="اسم المحاضرة - مثال: السؤال الأول"
            className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-yellow-400"
          />

          <input
            value={videoUrl}
            onChange={(e) =>
              setVideoUrl(e.target.value)
            }
            placeholder="رابط فيديو YouTube"
            inputMode="url"
            className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-yellow-400"
          />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-zinc-500">
              ترتيب الفصل
            </label>

            <input
              type="number"
              min="0"
              value={chapterOrder}
              onChange={(e) =>
                setChapterOrder(e.target.value)
              }
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-center outline-none focus:border-yellow-400"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500">
              ترتيب الموضوع
            </label>

            <input
              type="number"
              min="0"
              value={topicOrder}
              onChange={(e) =>
                setTopicOrder(e.target.value)
              }
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-center outline-none focus:border-yellow-400"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500">
              ترتيب المحاضرة
            </label>

            <input
              type="number"
              min="0"
              value={lectureOrder}
              onChange={(e) =>
                setLectureOrder(e.target.value)
              }
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-center outline-none focus:border-yellow-400"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={addReview}
          disabled={saving}
          className="mt-4 w-full rounded-xl bg-yellow-400 px-4 py-3 font-bold text-black disabled:opacity-50"
        >
          {saving
            ? 'جاري الإضافة...'
            : 'إضافة المحاضرة'}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
          {success}
        </div>
      )}

      <div className="mt-7">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">
            المحاضرات المضافة
          </h3>

          <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-400">
            {reviews.length} محاضرة
          </span>
        </div>

        {loading ? (
          <p className="mt-5 text-zinc-400">
            جاري تحميل المحاضرات...
          </p>
        ) : reviews.length === 0 ? (
          <div className="mt-5 rounded-xl border border-zinc-800 bg-black p-5 text-center text-zinc-500">
            لم تتم إضافة محاضرات بعد.
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            {Object.entries(groupedReviews).map(
              ([chapterName, topics]) => (
                <div
                  key={chapterName}
                  className="rounded-2xl border border-yellow-400/20 bg-black p-4"
                >
                  <h4 className="text-xl font-bold text-yellow-400">
                    {chapterName}
                  </h4>

                  <div className="mt-4 space-y-4">
                    {Object.entries(topics).map(
                      ([topicName, topicReviews]) => (
                        <div
                          key={topicName}
                          className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                        >
                          <h5 className="font-bold">
                            {topicName}
                          </h5>

                          <div className="mt-3 space-y-3">
                            {topicReviews.map(
                              (review) => (
                                <div
                                  key={review.id}
                                  className="rounded-xl border border-zinc-800 bg-black p-4"
                                >
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                      <p className="font-bold">
                                        {
                                          review.lecture_title
                                        }
                                      </p>

                                      <p className="mt-1 text-xs text-zinc-500">
                                        ترتيب المحاضرة:{' '}
                                        {
                                          review.lecture_order
                                        }
                                      </p>

                                      <p
                                        className={`mt-2 text-xs font-bold ${
                                          review.is_active
                                            ? 'text-green-400'
                                            : 'text-zinc-500'
                                        }`}
                                      >
                                        {review.is_active
                                          ? '● ظاهرة للطلاب'
                                          : '● مخفية عن الطلاب'}
                                      </p>
                                    </div>

                                    <a
                                      href={review.video_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm font-bold text-yellow-400"
                                    >
                                      فتح الفيديو
                                    </a>
                                  </div>

                                  <div className="mt-4 grid grid-cols-3 gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        editReview(review)
                                      }
                                      className="rounded-lg border border-zinc-700 px-3 py-2 text-sm font-bold"
                                    >
                                      تعديل
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        toggleReview(
                                          review
                                        )
                                      }
                                      className="rounded-lg border border-yellow-400/40 px-3 py-2 text-sm font-bold text-yellow-400"
                                    >
                                      {review.is_active
                                        ? 'إخفاء'
                                        : 'تفعيل'}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        deleteReview(
                                          review
                                        )
                                      }
                                      className="rounded-lg border border-red-500/40 px-3 py-2 text-sm font-bold text-red-400"
                                    >
                                      حذف
                                    </button>
                                  </div>
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
      </div>
    </section>
  )
}