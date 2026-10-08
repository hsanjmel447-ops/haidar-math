
'use client'

import { useEffect, useState } from 'react'
import PrivateQuizzes from '@/components/private-quizzes'
import PrivateWeeklyExams from '@/components/private-weekly-exams'
import PrivateLeaderboard from '@/components/private-leaderboard'
import PrivateMinisterialReviews from '@/components/private-ministerial-reviews'
import PrivateBasicLessons from '@/components/private-basic-lessons'

type Student = {
  id: number
  name: string
}

type Lecture = {
  id: number
  title: string
  chapter: string
  topic: string
  video_url: string
  sort_order: number
}

type Section =
  | 'home'
  | 'lectures'
  | 'quizzes'
  | 'weekly-exams'
  | 'certificates'
  | 'leaderboard'
  | 'ministerial-reviews'
  | 'basic-lessons'

type DailyMessage = {
  type: 'ayah' | 'motivation'
  text: string
  source?: string
}

const dailyMessages: DailyMessage[] = [
  {
    type: 'ayah',
    text: '﴿إِن يَنصُرْكُمُ اللَّهُ فَلَا غَالِبَ لَكُمْ﴾',
    source: 'آل عمران: 160',
  },
  {
    type: 'ayah',
    text: '﴿فَإِنَّ مَعَ الْعُسْرِ يُسْرًا﴾',
    source: 'الشرح: 5',
  },
  {
    type: 'ayah',
    text: '﴿إِنَّ مَعَ الْعُسْرِ يُسْرًا﴾',
    source: 'الشرح: 6',
  },
  {
    type: 'ayah',
    text: '﴿سَيَجْعَلُ اللَّهُ بَعْدَ عُسْرٍ يُسْرًا﴾',
    source: 'الطلاق: 7',
  },
  {
    type: 'ayah',
    text: '﴿وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ﴾',
    source: 'الطلاق: 3',
  },
  {
    type: 'ayah',
    text: '﴿وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا﴾',
    source: 'الطلاق: 2',
  },
  {
    type: 'ayah',
    text: '﴿أَلَيْسَ اللَّهُ بِكَافٍ عَبْدَهُ﴾',
    source: 'الزمر: 36',
  },
  {
    type: 'ayah',
    text: '﴿أَلَا إِنَّ نَصْرَ اللَّهِ قَرِيبٌ﴾',
    source: 'البقرة: 214',
  },
  {
    type: 'ayah',
    text: '﴿لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا﴾',
    source: 'البقرة: 286',
  },
  {
    type: 'ayah',
    text: '﴿إِنَّ اللَّهَ مَعَ الصَّابِرِينَ﴾',
    source: 'البقرة: 153',
  },
  {
    type: 'ayah',
    text: '﴿وَقُل رَّبِّ زِدْنِي عِلْمًا﴾',
    source: 'طه: 114',
  },
  {
    type: 'ayah',
    text: '﴿حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ﴾',
    source: 'آل عمران: 173',
  },
  {
    type: 'ayah',
    text: '﴿لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا﴾',
    source: 'التوبة: 40',
  },
  {
    type: 'ayah',
    text: '﴿إِنَّ مَعِيَ رَبِّي سَيَهْدِينِ﴾',
    source: 'الشعراء: 62',
  },
  {
    type: 'ayah',
    text: '﴿إِنَّ رَبِّي قَرِيبٌ مُّجِيبٌ﴾',
    source: 'هود: 61',
  },
  {
    type: 'ayah',
    text: '﴿إِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ﴾',
    source: 'التوبة: 120',
  },
  {
    type: 'ayah',
    text: '﴿وَرَحْمَتِي وَسِعَتْ كُلَّ شَيْءٍ﴾',
    source: 'الأعراف: 156',
  },
  {
    type: 'ayah',
    text: '﴿وَمَا النَّصْرُ إِلَّا مِنْ عِندِ اللَّهِ﴾',
    source: 'آل عمران: 126',
  },
  {
    type: 'ayah',
    text: '﴿لَا تَدْرِي لَعَلَّ اللَّهَ يُحْدِثُ بَعْدَ ذَٰلِكَ أَمْرًا﴾',
    source: 'الطلاق: 1',
  },
  {
    type: 'ayah',
    text: '﴿وَاصْبِرْ فَإِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ﴾',
    source: 'هود: 115',
  },
  {
    type: 'ayah',
    text: '﴿فَاللَّهُ خَيْرٌ حَافِظًا وَهُوَ أَرْحَمُ الرَّاحِمِينَ﴾',
    source: 'يوسف: 64',
  },
  {
    type: 'ayah',
    text: '﴿إِنَّهُ مَن يَتَّقِ وَيَصْبِرْ فَإِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ﴾',
    source: 'يوسف: 90',
  },
  {
    type: 'ayah',
    text: '﴿رَبِّ اشْرَحْ لِي صَدْرِي ۝ وَيَسِّرْ لِي أَمْرِي﴾',
    source: 'طه: 25-26',
  },
  {
    type: 'ayah',
    text: '﴿إِنَّ اللَّهَ يُحِبُّ الْمُتَوَكِّلِينَ﴾',
    source: 'آل عمران: 159',
  },
  {
    type: 'ayah',
    text: '﴿وَلَا تَهِنُوا وَلَا تَحْزَنُوا﴾',
    source: 'آل عمران: 139',
  },
  {
    type: 'motivation',
    text: 'لا تجعل صعوبة البداية تقنعك باستحالة النهاية.',
  },
  {
    type: 'motivation',
    text: 'كل سؤال تتعب عليه اليوم، قد يكون درجة تنقذك غدًا.',
  },
  {
    type: 'motivation',
    text: 'لا تحتاج أن تكون الأفضل اليوم؛ تحتاج أن تكون أفضل من الأمس.',
  },
  {
    type: 'motivation',
    text: 'حين يتوقف الآخرون بسبب التعب، يبدأ الفرق الذي يصنعه الاستمرار.',
  },
  {
    type: 'motivation',
    text: 'الامتحان لا يعرف كم كنت خائفًا؛ يعرف فقط مقدار استعدادك.',
  },
  {
    type: 'motivation',
    text: 'لا تحكم على مستقبلك من يوم دراسي سيئ.',
  },
  {
    type: 'motivation',
    text: 'ساعة تركيز حقيقية أقوى من ساعات طويلة من التأجيل.',
  },
  {
    type: 'motivation',
    text: 'لا تخف من كثرة ما بقي؛ ابدأ بما أمامك.',
  },
  {
    type: 'motivation',
    text: 'أصعب مسألة اليوم قد تصبح أسهل سؤال في الامتحان بسبب تدريبك.',
  },
  {
    type: 'motivation',
    text: 'كل مرة تعود فيها للدراسة بعد التعب، أنت تبني انضباطك.',
  },
  {
    type: 'motivation',
    text: 'هدفك لا يحتاج حماسًا كل يوم؛ يحتاج منك ألّا تتوقف.',
  },
  {
    type: 'motivation',
    text: 'لا تنتظر الثقة حتى تبدأ؛ ابدأ حتى تأتيك الثقة.',
  },
  {
    type: 'motivation',
    text: 'الدرجة العالية ليست لحظة حظ؛ إنها تراكم أيام لم تستسلم فيها.',
  },
  {
    type: 'motivation',
    text: 'حتى لو تأخرت، ما دام أمامك وقت فهناك شيء تستطيع تغييره.',
  },
  {
    type: 'motivation',
    text: 'لا تجعل خطأً في سؤال يهزمك؛ افهمه حتى لا يتكرر.',
  },
  {
    type: 'motivation',
    text: 'ركز على الصفحة التي أمامك، لا على حجم الكتاب كله.',
  },
  {
    type: 'motivation',
    text: 'منافسك الحقيقي هو مستواك بالأمس.',
  },
  {
    type: 'motivation',
    text: 'ما تتقنه اليوم تحت التدريب، ستواجهه غدًا بثبات.',
  },
  {
    type: 'motivation',
    text: 'قد لا ترى نتيجة تعبك الآن، لكن كل فهم جديد يتراكم.',
  },
  {
    type: 'motivation',
    text: 'ابدأ ولو بعشر دقائق؛ البداية تكسر ثقل التأجيل.',
  },
  {
    type: 'motivation',
    text: 'إذا تعبت، خفف السرعة ولا تترك الطريق.',
  },
  {
    type: 'motivation',
    text: 'لا تقل فاتني الكثير؛ اسأل ماذا أستطيع إنجازه من الآن.',
  },
  {
    type: 'motivation',
    text: 'ورقة الامتحان تصبح أقل رهبة كلما واجهت أسئلة أكثر قبلها.',
  },
  {
    type: 'motivation',
    text: 'نجاحك لا يحتاج يومًا مثاليًا؛ يحتاج أيامًا عادية تستمر فيها.',
  },
  {
    type: 'motivation',
    text: 'ستأتي لحظة تنظر فيها إلى هذا التعب وتعرف أنه كان يستحق.',
  },
]

function getDeviceId() {
  const storageKey = 'private_student_device_id'

  let deviceId = localStorage.getItem(storageKey)

  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem(storageKey, deviceId)
  }

  return deviceId
}

export default function PrivateStudentsPage() {
  const [code, setCode] = useState('')
  const [student, setStudent] = useState<Student | null>(null)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  const [activeSection, setActiveSection] =
    useState<Section>('home')

  const [lectures, setLectures] = useState<Lecture[]>([])
  const [lecturesLoading, setLecturesLoading] =
    useState(false)
  const [lecturesError, setLecturesError] = useState('')

  const getDailyMessage = () => {
    if (!student) return null

    const now = new Date()

    const dayKey = Math.floor(
      Date.UTC(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ) / 86400000
    )

    const index =
      Math.abs(student.id * 31 + dayKey) %
      dailyMessages.length

    return dailyMessages[index]
  }

  const dailyMessage = getDailyMessage()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const deviceId = getDeviceId()

        const response = await fetch('/api/private-session', {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'x-device-id': deviceId,
          },
        })

        const data = await response.json()

        if (
          response.ok &&
          data.success &&
          data.student
        ) {
          setStudent(data.student)
        }
      } catch {
        // إذا فشل فحص الجلسة تظهر شاشة تسجيل الدخول
      } finally {
        setCheckingSession(false)
      }
    }

    checkSession()
  }, [])

  const enterPrivateArea = async () => {
    if (!code.trim()) {
      setError('أدخل كود الاشتراك')
      return
    }

    setLoading(true)
    setError('')

    try {
      const deviceId = getDeviceId()

      const response = await fetch('/api/private-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim(),
          deviceId,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            data.error ||
            'تعذر تسجيل الدخول'
        )
        return
      }

      setStudent(data.student)
      setCode('')
      setActiveSection('home')
    } catch {
      setError('تعذر الاتصال، حاول مرة أخرى')
    } finally {
      setLoading(false)
    }
  }

  const loadLectures = async () => {
    setLecturesLoading(true)
    setLecturesError('')

    try {
      const deviceId = getDeviceId()

      const response = await fetch('/api/private-lectures', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'x-device-id': deviceId,
        },
      })

      const data = await response.json()

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        setLecturesError(
          data.error || 'تعذر التحقق من الاشتراك'
        )
        return
      }

      if (!response.ok || !data.success) {
        setLecturesError(
          data.error || 'تعذر تحميل المحاضرات'
        )
        return
      }

      setLectures(data.lectures ?? [])
      setActiveSection('lectures')
    } catch {
      setLecturesError(
        'تعذر الاتصال، حاول مرة أخرى'
      )
    } finally {
      setLecturesLoading(false)
    }
  }

  const logout = async () => {
    setLoggingOut(true)

    try {
      await fetch('/api/private-logout', {
        method: 'POST',
      })
    } catch {
      // حتى إذا فشل الطلب نعيد المستخدم لشاشة الدخول
    } finally {
      setStudent(null)
      setCode('')
      setError('')
      setLectures([])
      setLecturesError('')
      setActiveSection('home')
      setLoggingOut(false)
    }
  }

  const goHome = () => {
    setActiveSection('home')
    setLecturesError('')
  }

  const groupedLectures = lectures.reduce<
    Record<string, Record<string, Lecture[]>>
  >((groups, lecture) => {
    const chapter = lecture.chapter || 'بدون فصل'
    const topic = lecture.topic || 'بدون موضوع'

    if (!groups[chapter]) {
      groups[chapter] = {}
    }

    if (!groups[chapter][topic]) {
      groups[chapter][topic] = []
    }

    groups[chapter][topic].push(lecture)

    return groups
  }, {})

  if (checkingSession) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-black px-4 text-white"
      >
        <div className="text-center">
          <div className="text-4xl">🔒</div>

          <p className="mt-4 text-zinc-400">
            جاري التحقق من تسجيل الدخول...
          </p>
        </div>
      </main>
    )
  }

  if (student) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-black px-4 py-8 text-white"
      >
        <div className="mx-auto max-w-5xl">

          {/* رأس منطقة الطالب */}
          <div className="rounded-2xl border border-yellow-400/30 bg-zinc-950 p-6">
            <p className="text-sm font-bold text-yellow-400">
              منطقة حصرية لطلاب الخاص
            </p>

            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold">
                  أهلاً {student.name} 🎓
                </h1>

                <p className="mt-2 text-zinc-400">
                  جميع محتويات دورة الرياضيات الخاصة بك في مكان واحد.
                </p>
              </div>

              <button
                type="button"
                onClick={logout}
                disabled={loggingOut}
                className="rounded-xl border border-zinc-700 px-5 py-3 font-bold transition hover:border-red-500 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loggingOut
                  ? 'جاري تسجيل الخروج...'
                  : 'تسجيل الخروج'}
              </button>
            </div>
          </div>

          {/* الصفحة الرئيسية */}
          {activeSection === 'home' && (
            <section className="mt-8">
              {dailyMessage && (
                <div className="mb-6 rounded-2xl border border-yellow-400/30 bg-zinc-950 p-5 text-center">
                  <p className="text-sm font-bold text-yellow-400">
                    {dailyMessage.type === 'ayah'
                      ? '🌿 آية اليوم'
                      : '✨ رسالة اليوم'}
                  </p>

                  <p
                    className={`mt-3 font-bold leading-8 text-white ${
                      dailyMessage.type === 'ayah'
                        ? 'text-xl'
                        : 'text-lg'
                    }`}
                  >
                    {dailyMessage.text}
                  </p>

                  {dailyMessage.source && (
                    <p className="mt-3 text-sm text-zinc-400">
                      {dailyMessage.source}
                    </p>
                  )}
                </div>
              )}

              <div className="text-center">
                <h2 className="text-2xl font-bold">
                  لوحة الطالب
                </h2>

                <p className="mt-2 text-zinc-400">
                  اختر القسم الذي تريد الدخول إليه
                </p>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-3">

                {/* المحاضرات */}
                <button
                  type="button"
                  onClick={loadLectures}
                  disabled={lecturesLoading}
                  className="group flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-yellow-400/30 bg-zinc-950 p-5 text-center transition hover:border-yellow-400 hover:bg-zinc-900 disabled:opacity-50"
                >
                  <div className="text-5xl transition group-hover:scale-110">
                    🎥
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-yellow-400">
                    المحاضرات الخاصة
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    محاضرات الدورة مرتبة حسب الفصل والموضوع
                  </p>

                  {lecturesLoading && (
                    <p className="mt-3 text-xs text-yellow-400">
                      جاري التحميل...
                    </p>
                  )}
                </button>

                {/* الاختبارات اليومية */}
                <button
                  type="button"
                  onClick={() => setActiveSection('quizzes')}
                  className="group flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-center transition hover:border-yellow-400 hover:bg-zinc-900"
                >
                  <div className="text-5xl transition group-hover:scale-110">
                    📝
                  </div>

                  <h3 className="mt-4 text-lg font-bold">
                    الاختبارات اليومية
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    اختبر مستواك وثبّت معلوماتك
                  </p>
                </button>

                {/* الاختبارات الأسبوعية */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveSection('weekly-exams')
                  }
                  className="group flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-center transition hover:border-yellow-400 hover:bg-zinc-900"
                >
                  <div className="text-5xl transition group-hover:scale-110">
                    📋
                  </div>

                  <h3 className="mt-4 text-lg font-bold">
                    الاختبارات الأسبوعية
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    حل على الورق وارفع صور إجابتك
                  </p>
                </button>

                {/* شهاداتي */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveSection('certificates')
                  }
                  className="group flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-yellow-400/40 bg-zinc-950 p-5 text-center transition hover:border-yellow-400 hover:bg-zinc-900"
                >
                  <div className="text-5xl transition group-hover:scale-110">
                    🏅
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-yellow-400">
                    شهاداتي
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    شهادات الامتياز والتفوق في الاختبارات الأسبوعية
                  </p>
                </button>

                {/* لوحة النخبة */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveSection('leaderboard')
                  }
                  className="group flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-center transition hover:border-yellow-400 hover:bg-zinc-900"
                >
                  <div className="text-5xl transition group-hover:scale-110">
                    🏆
                  </div>

                  <h3 className="mt-4 text-lg font-bold">
                    لوحة الطلبة النخبة
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    شاهد ترتيبك ونقاطك بين الطلاب
                  </p>
                </button>

                {/* مراجعة الأسئلة الوزارية */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveSection('ministerial-reviews')
                  }
                  className="group flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-yellow-400/30 bg-zinc-950 p-5 text-center transition hover:border-yellow-400 hover:bg-zinc-900"
                >
                  <div className="text-5xl transition group-hover:scale-110">
                    📚
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-yellow-400">
                    مراجعة الأسئلة الوزارية
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    شرح مختصر للأسئلة الوزارية حسب الفصل والموضوع
                  </p>
                </button>

                {/* شرح الأساسيات */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveSection('basic-lessons')
                  }
                  className="group flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-yellow-400/30 bg-zinc-950 p-5 text-center transition hover:border-yellow-400 hover:bg-zinc-900"
                >
                  <div className="text-5xl transition group-hover:scale-110">
                    📐
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-yellow-400">
                    شرح الأساسيات
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    مراجعة وشرح أساسيات الرياضيات المهمة
                  </p>
                </button>
              </div>

              {lecturesError && (
                <p className="mt-5 text-center text-sm text-red-400">
                  {lecturesError}
                </p>
              )}
            </section>
          )}

          {/* المحاضرات الخاصة */}
          {activeSection === 'lectures' && (
            <section className="mt-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-yellow-400">
                    طلاب الخاص
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    🎥 المحاضرات الخاصة
                  </h2>

                  <p className="mt-2 text-zinc-400">
                    اختر الدرس المطلوب ثم افتح رابط المحاضرة.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={goHome}
                  className="rounded-xl border border-zinc-700 px-5 py-3 font-bold"
                >
                  ← رجوع للوحة الطالب
                </button>
              </div>

              {lectures.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center">
                  <p className="text-zinc-400">
                    لا توجد محاضرات متاحة حالياً.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-6">
                  {Object.entries(groupedLectures).map(
                    ([chapter, topics]) => (
                      <div
                        key={chapter}
                        className="rounded-2xl border border-yellow-400/30 bg-zinc-950 p-5"
                      >
                        <h3 className="text-2xl font-bold text-yellow-400">
                          {chapter}
                        </h3>

                        <div className="mt-5 space-y-5">
                          {Object.entries(topics).map(
                            ([topic, topicLectures]) => (
                              <div
                                key={topic}
                                className="rounded-xl border border-zinc-800 bg-black p-4"
                              >
                                <h4 className="text-xl font-bold">
                                  {topic}
                                </h4>

                                <div className="mt-4 space-y-3">
                                  {topicLectures.map(
                                    (lecture) => (
                                      <div
                                        key={lecture.id}
                                        className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:flex-row sm:items-center sm:justify-between"
                                      >
                                        <div>
                                          <p className="font-bold">
                                            {lecture.title}
                                          </p>

                                          <p className="mt-1 text-xs text-zinc-500">
                                            الدرس رقم{' '}
                                            {lecture.sort_order}
                                          </p>
                                        </div>

                                        <a
                                          href={lecture.video_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="rounded-xl bg-yellow-400 px-5 py-3 text-center font-bold text-black"
                                        >
                                          مشاهدة المحاضرة
                                        </a>
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
            </section>
          )}

          {/* الاختبارات اليومية */}
          {activeSection === 'quizzes' && (
            <PrivateQuizzes
              deviceId={getDeviceId()}
              onBack={goHome}
            />
          )}

          {/* الاختبارات الأسبوعية */}
          {activeSection === 'weekly-exams' && (
            <section className="mt-6">
              <button
                type="button"
                onClick={goHome}
                className="mb-2 rounded-xl border border-zinc-700 px-5 py-3 font-bold"
              >
                ← رجوع للوحة الطالب
              </button>

              <PrivateWeeklyExams />
            </section>
          )}

          {/* شهاداتي */}
          {activeSection === 'certificates' && (
            <section className="mt-6">
              <button
                type="button"
                onClick={goHome}
                className="mb-4 rounded-xl border border-zinc-700 px-5 py-3 font-bold"
              >
                ← رجوع للوحة الطالب
              </button>

              <div className="rounded-2xl border border-yellow-400/30 bg-zinc-950 p-8 text-center">
                <div className="text-5xl">🏅</div>

                <h2 className="mt-4 text-2xl font-bold text-yellow-400">
                  شهاداتي
                </h2>

                <p className="mt-3 text-zinc-400">
                  هنا ستظهر شهادات الامتياز والتفوق بعد اعتماد نتائج الاختبارات الأسبوعية.
                </p>
              </div>
            </section>
          )}

          {/* لوحة النخبة */}
          {activeSection === 'leaderboard' && (
            <section className="mt-6">
              <button
                type="button"
                onClick={goHome}
                className="mb-2 rounded-xl border border-zinc-700 px-5 py-3 font-bold"
              >
                ← رجوع للوحة الطالب
              </button>

              <PrivateLeaderboard />
            </section>
          )}

          {/* مراجعة الأسئلة الوزارية */}
          {activeSection === 'ministerial-reviews' && (
            <section className="mt-6">
              <button
                type="button"
                onClick={goHome}
                className="mb-4 rounded-xl border border-zinc-700 px-5 py-3 font-bold"
              >
                ← رجوع للوحة الطالب
              </button>

              <PrivateMinisterialReviews />
            </section>
          )}

          {/* شرح الأساسيات */}
          {activeSection === 'basic-lessons' && (
            <section className="mt-6">
              <button
                type="button"
                onClick={goHome}
                className="mb-4 rounded-xl border border-zinc-700 px-5 py-3 font-bold"
              >
                ← رجوع للوحة الطالب
              </button>

              <PrivateBasicLessons />
            </section>
          )}
        </div>
      </main>
    )
  }

  /* شاشة تسجيل الدخول */
  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-black px-4 text-white"
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <div className="text-center">
          <div className="text-4xl">
            🔒
          </div>

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
          onChange={(e) =>
            setCode(e.target.value)
          }
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
          {loading
            ? 'جاري التحقق...'
            : 'دخول طلاب الخاص'}
        </button>

        <p className="mt-5 text-center text-xs text-zinc-500">
          هذه المنطقة مخصصة لطلاب الأستاذ حيدر محمد المشتركين
        </p>
      </div>
    </main>
  )
}
