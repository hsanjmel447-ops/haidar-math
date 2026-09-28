'use client'

import { useEffect, useState } from 'react'

type LeaderboardEntry = {
  student_id: number
  name: string
  points: number
  rank: number
}

type MyEntry = {
  student_id: number
  name: string
  points: number
  rank: number
  gap_to_next: number
}

type LeaderboardResponse = {
  success: boolean
  leaderboard: LeaderboardEntry[]
  me: MyEntry | null
  total_students: number
  error?: string
}

function getDeviceId() {
  if (typeof window === 'undefined') {
    return ''
  }

  let deviceId = localStorage.getItem(
    'private_student_device_id'
  )

  if (!deviceId) {
    deviceId = crypto.randomUUID()

    localStorage.setItem(
      'private_student_device_id',
      deviceId
    )
  }

  return deviceId
}

function medal(rank: number) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'

  return `#${rank}`
}

export default function PrivateLeaderboard() {
  const [leaderboard, setLeaderboard] =
    useState<LeaderboardEntry[]>([])

  const [me, setMe] =
    useState<MyEntry | null>(null)

  const [totalStudents, setTotalStudents] =
    useState(0)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  async function loadLeaderboard() {
    setLoading(true)
    setError('')

    try {
      const deviceId = getDeviceId()

      const response = await fetch(
        '/api/private-leaderboard',
        {
          cache: 'no-store',
          headers: {
            'x-device-id': deviceId,
          },
        }
      )

      const data: LeaderboardResponse =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            'تعذر تحميل لوحة النخبة'
        )
      }

      setLeaderboard(
        data.leaderboard ?? []
      )

      setMe(data.me ?? null)

      setTotalStudents(
        data.total_students ?? 0
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'تعذر تحميل لوحة النخبة'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLeaderboard()
  }, [])

  return (
    <section
      dir="rtl"
      className="mt-8 overflow-hidden rounded-3xl border border-yellow-400/30 bg-zinc-950 text-white"
    >
      <div className="border-b border-zinc-800 bg-gradient-to-b from-yellow-400/10 to-transparent p-6 text-center">
        <div className="text-4xl">
          🏆
        </div>

        <h2 className="mt-2 text-3xl font-black">
          لوحة الطلبة النخبة
        </h2>

        <p className="mt-2 text-sm text-zinc-400">
          الترتيب حسب مجموع نقاط
          الاختبارات الأسبوعية
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-zinc-400">
          جاري تحميل الترتيب...
        </div>
      ) : error ? (
        <div className="p-6">
          <div className="rounded-2xl bg-red-500/10 p-4 text-center text-red-300">
            {error}
          </div>

          <button
            type="button"
            onClick={loadLeaderboard}
            className="mt-4 w-full rounded-xl border border-zinc-700 px-4 py-3 font-bold"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : (
        <div className="p-5">
          {me && (
            <div className="mb-6 rounded-2xl border border-yellow-400/40 bg-yellow-400/10 p-5">
              <p className="text-sm font-bold text-yellow-400">
                ترتيبك الحالي
              </p>

              <div className="mt-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-3xl font-black">
                    المركز {me.rank}
                  </p>

                  <p className="mt-1 text-zinc-400">
                    من أصل {totalStudents}{' '}
                    طالب
                  </p>
                </div>

                <div className="text-left">
                  <p className="text-3xl font-black text-yellow-400">
                    {me.points}
                  </p>

                  <p className="text-sm text-zinc-400">
                    نقطة نخبة
                  </p>
                </div>
              </div>

              {me.rank === 1 ? (
                <p className="mt-4 rounded-xl bg-black/40 p-3 text-center font-bold text-yellow-300">
                  👑 أنت في صدارة لوحة
                  النخبة
                </p>
              ) : (
                <p className="mt-4 rounded-xl bg-black/40 p-3 text-center text-sm text-zinc-300">
                  تحتاج{' '}
                  <span className="font-black text-yellow-400">
                    {me.gap_to_next}
                  </span>{' '}
                  نقطة لمعادلة الطالب
                  الذي يسبقك
                </p>
              )}
            </div>
          )}

          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-black">
              الترتيب العام
            </h3>

            <span className="text-sm text-zinc-500">
              أفضل 20 طالبًا
            </span>
          </div>

          {leaderboard.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-black p-6 text-center text-zinc-400">
              لا توجد نقاط حتى الآن.
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map(
                (student) => {
                  const isMe =
                    me?.student_id ===
                    student.student_id

                  return (
                    <div
                      key={
                        student.student_id
                      }
                      className={`flex items-center justify-between gap-3 rounded-2xl border p-4 ${
                        isMe
                          ? 'border-yellow-400/60 bg-yellow-400/10'
                          : 'border-zinc-800 bg-black'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-lg font-black">
                          {medal(
                            student.rank
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-bold">
                            {student.name}

                            {isMe && (
                              <span className="mr-2 text-xs text-yellow-400">
                                أنت
                              </span>
                            )}
                          </p>

                          <p className="mt-1 text-xs text-zinc-500">
                            المركز{' '}
                            {student.rank}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-left">
                        <p className="text-xl font-black text-yellow-400">
                          {student.points}
                        </p>

                        <p className="text-xs text-zinc-500">
                          نقطة
                        </p>
                      </div>
                    </div>
                  )
                }
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}