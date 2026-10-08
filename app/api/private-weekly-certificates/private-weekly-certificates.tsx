
'use client'

import { useEffect, useState } from 'react'

type Certificate = {
  id: number
  certificate_code: string
  certificate_type: string
  student_name: string
  exam_title: string
  final_score: number
  total_score: number
  percentage: number
  design_number: number
  motivation_number: number
  issued_at: string
}

function getDeviceId() {
  return localStorage.getItem('private_student_device_id') ?? ''
}

export default function PrivateWeeklyCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadCertificates = async () => {
      try {
        const response = await fetch(
          '/api/private-weekly-certificates',
          {
            cache: 'no-store',
            headers: {
              'x-device-id': getDeviceId(),
            },
          }
        )

        const data = await response.json()

        if (!response.ok || !data.success) {
          setError(data.error || 'تعذر تحميل الشهادات')
          return
        }

        setCertificates(data.certificates ?? [])
      } catch {
        setError('تعذر الاتصال بالخادم')
      } finally {
        setLoading(false)
      }
    }

    loadCertificates()
  }, [])

  if (loading) {
    return (
      <div className="py-12 text-center text-zinc-400">
        جاري تحميل شهاداتك...
      </div>
    )
  }

  return (
    <section dir="rtl" className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-yellow-400">
          🏅 شهاداتي
        </h2>

        <p className="mt-3 text-sm text-zinc-400">
          شهادات التميز والتفوق في الاختبارات الأسبوعية
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center text-red-400">
          {error}
        </div>
      )}

      {!error && certificates.length === 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center">
          <div className="text-5xl">🎓</div>

          <h3 className="mt-4 text-xl font-bold">
            لا توجد شهادات حالياً
          </h3>

          <p className="mt-3 text-sm leading-7 text-zinc-400">
            ستظهر شهاداتك هنا بعد انتهاء الاختبار الأسبوعي
            وتصحيح إجاباتك واعتماد النتائج من الأستاذ.
          </p>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {certificates.map((certificate) => {
          const isExcellent =
            certificate.certificate_type === 'excellence' ||
            Number(certificate.percentage) === 100

          return (
            <article
              key={certificate.id}
              className={`rounded-2xl border p-6 ${
                isExcellent
                  ? 'border-yellow-400/50 bg-gradient-to-b from-yellow-950/40 to-zinc-950'
                  : 'border-sky-400/40 bg-gradient-to-b from-sky-950/30 to-zinc-950'
              }`}
            >
              <div className="text-center">
                <div className="text-5xl">
                  {isExcellent ? '🥇' : '🏆'}
                </div>

                <h3
                  className={`mt-4 text-2xl font-bold ${
                    isExcellent
                      ? 'text-yellow-400'
                      : 'text-sky-300'
                  }`}
                >
                  {isExcellent
                    ? 'شهادة امتياز'
                    : 'شهادة تفوق'}
                </h3>

                <p className="mt-4 text-lg font-bold">
                  {certificate.student_name}
                </p>

                <p className="mt-2 text-sm text-zinc-400">
                  {certificate.exam_title}
                </p>

                <p className="mt-5 text-4xl font-black">
                  {Number(certificate.percentage).toLocaleString(
                    'en-US',
                    { maximumFractionDigits: 2 }
                  )}
                  %
                </p>

                <p className="mt-2 text-sm text-zinc-400">
                  الدرجة: {certificate.final_score} من{' '}
                  {certificate.total_score}
                </p>

                <p className="mt-4 text-xs text-zinc-500">
                  تاريخ الإصدار:{' '}
                  {new Date(
                    certificate.issued_at
                  ).toLocaleDateString('ar-IQ')}
                </p>

                <p className="mt-3 break-all text-xs text-zinc-600">
                  رقم التحقق: {certificate.certificate_code}
                </p>

                <div className="mt-5 rounded-xl border border-zinc-700 p-3 text-sm text-zinc-400">
                  قريباً: تحميل الشهادة بصيغة PDF
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
