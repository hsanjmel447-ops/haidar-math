'use client'

import { useCallback, useEffect, useState } from 'react'
import AdminQuizzes from '@/components/admin-quizzes'
import AdminStudyPlan from '@/components/admin-study-plan'
import AdminWeeklyExams from '@/components/admin-weekly-exams'
import AdminMinisterialReviews from '@/components/admin-ministerial-reviews'
import AdminBasicLessons from '@/components/admin-basic-lessons'
type Student = {
  id: number
  name: string
  access_code: string
  is_active: boolean
  expires_at: string | null
  created_at: string
  device_id: string | null
}

type Lecture = {
  id: number
  title: string
  chapter: string
  topic: string
  video_url: string
  is_active: boolean
  sort_order: number
  created_at: string
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [checkingSession, setCheckingSession] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const [lectures, setLectures] = useState<Lecture[]>([])
  const [lecturesLoading, setLecturesLoading] = useState(false)
  const [lectureTitle, setLectureTitle] = useState('')
  const [lectureChapter, setLectureChapter] = useState('')
  const [lectureTopic, setLectureTopic] = useState('')
  const [lectureVideoUrl, setLectureVideoUrl] = useState('')
  const [lectureSortOrder, setLectureSortOrder] = useState('')
  const [addingLecture, setAddingLecture] = useState(false)
  const [lectureError, setLectureError] = useState('')
  const [lectureSuccess, setLectureSuccess] = useState('')
  const [updatingLectureId, setUpdatingLectureId] =
    useState<number | null>(null)

  const [students, setStudents] = useState<Student[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [updatingStudentId, setUpdatingStudentId] =
    useState<number | null>(null)
  const [resettingDeviceId, setResettingDeviceId] =
    useState<number | null>(null)

  const [editingStudentId, setEditingStudentId] =
    useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editAccessCode, setEditAccessCode] = useState('')
  const [editExpiresAt, setEditExpiresAt] = useState('')
  const [editError, setEditError] = useState('')
  const [editSuccess, setEditSuccess] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  const [name, setName] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [addingStudent, setAddingStudent] = useState(false)

  const loadLectures = useCallback(async () => {
    setLecturesLoading(true)
    setLectureError('')

    try {
      const response = await fetch('/api/admin-lectures', {
        method: 'GET',
        cache: 'no-store',
      })

      const data = await response.json()

      if (response.status === 401) {
        setIsAdmin(false)
        return
      }

      if (!response.ok || !data.success) {
        setLectureError(
          data.error || 'تعذر تحميل المحاضرات'
        )
        return
      }

      setLectures(data.lectures ?? [])
    } catch {
      setLectureError('تعذر تحميل المحاضرات')
    } finally {
      setLecturesLoading(false)
    }
  }, [])

  const loadStudents = useCallback(async () => {
    setStudentsLoading(true)

    try {
      const response = await fetch('/api/admin-students', {
        method: 'GET',
        cache: 'no-store',
      })

      const data = await response.json()

      if (response.status === 401) {
        setIsAdmin(false)
        return
      }

      if (response.ok && data.success) {
        setStudents(data.students ?? [])
      }
    } catch {
      // نبقي القائمة كما هي إذا فشل الاتصال مؤقتاً
    } finally {
      setStudentsLoading(false)
    }
  }, [])

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/admin-session', {
          method: 'GET',
          cache: 'no-store',
        })

        const data = await response.json()

        if (response.ok && data.success) {
          setIsAdmin(true)
        }
      } catch {
        setIsAdmin(false)
      } finally {
        setCheckingSession(false)
      }
    }

    checkSession()
  }, [])

  useEffect(() => {
    if (isAdmin) {
      loadStudents()
      loadLectures()
    }
  }, [isAdmin, loadStudents, loadLectures])

  const login = async () => {
    if (!password) {
      setLoginError('أدخل كلمة مرور الإدارة')
      return
    }

    setLoginLoading(true)
    setLoginError('')

    try {
      const response = await fetch('/api/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setLoginError(
          data.message ||
            data.error ||
            'كلمة المرور غير صحيحة'
        )
        return
      }

      setPassword('')
      setIsAdmin(true)
    } catch {
      setLoginError('تعذر الاتصال، حاول مرة أخرى')
    } finally {
      setLoginLoading(false)
    }
  }

  const addLecture = async () => {
    if (!lectureTitle.trim()) {
      setLectureError('أدخل عنوان المحاضرة')
      return
    }

    if (!lectureChapter.trim()) {
      setLectureError('أدخل الفصل')
      return
    }

    if (!lectureTopic.trim()) {
      setLectureError('أدخل الموضوع')
      return
    }

    if (!lectureVideoUrl.trim()) {
      setLectureError('أدخل رابط الفيديو')
      return
    }

    setAddingLecture(true)
    setLectureError('')
    setLectureSuccess('')

    try {
      const response = await fetch('/api/admin-lectures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: lectureTitle.trim(),
          chapter: lectureChapter.trim(),
          topic: lectureTopic.trim(),
          videoUrl: lectureVideoUrl.trim(),
          sortOrder: Number(lectureSortOrder || 0),
        }),
      })

      const data = await response.json()

      if (response.status === 401) {
        setIsAdmin(false)
        return
      }

      if (!response.ok || !data.success) {
        setLectureError(
          data.message ||
            data.error ||
            'تعذر إضافة المحاضرة'
        )
        return
      }

      setLectureTitle('')
      setLectureChapter('')
      setLectureTopic('')
      setLectureVideoUrl('')
      setLectureSortOrder('')
      setLectureSuccess('تمت إضافة المحاضرة بنجاح ✅')

      await loadLectures()
    } catch {
      setLectureError('تعذر الاتصال، حاول مرة أخرى')
    } finally {
      setAddingLecture(false)
    }
  }

  const toggleLecture = async (lecture: Lecture) => {
    setUpdatingLectureId(lecture.id)
    setLectureError('')
    setLectureSuccess('')

    try {
      const response = await fetch('/api/admin-lectures', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lectureId: lecture.id,
          isActive: !lecture.is_active,
        }),
      })

      const data = await response.json()

      if (response.status === 401) {
        setIsAdmin(false)
        return
      }

      if (!response.ok || !data.success) {
        setLectureError(
          data.message ||
            data.error ||
            'تعذر تحديث المحاضرة'
        )
        return
      }

      setLectures((currentLectures) =>
        currentLectures.map((item) =>
          item.id === lecture.id ? data.lecture : item
        )
      )

      setLectureSuccess(
        lecture.is_active
          ? 'تم إيقاف المحاضرة ✅'
          : 'تم تفعيل المحاضرة ✅'
      )
    } catch {
      setLectureError('تعذر تحديث المحاضرة')
    } finally {
      setUpdatingLectureId(null)
    }
  }

  const addStudent = async () => {
    if (!name.trim()) {
      setFormError('أدخل اسم الطالب')
      return
    }

    if (!accessCode.trim()) {
      setFormError('أدخل كود الطالب')
      return
    }

    if (accessCode.trim().length < 6) {
      setFormError('الكود يجب أن يكون 6 خانات على الأقل')
      return
    }

    setAddingStudent(true)
    setFormError('')
    setFormSuccess('')

    try {
      const response = await fetch('/api/admin-students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          accessCode: accessCode.trim(),
          expiresAt: expiresAt || null,
        }),
      })

      const data = await response.json()

      if (response.status === 401) {
        setIsAdmin(false)
        return
      }

      if (!response.ok || !data.success) {
        setFormError(
          data.message ||
            data.error ||
            'تعذر إضافة الطالب'
        )
        return
      }

      setName('')
      setAccessCode('')
      setExpiresAt('')
      setFormSuccess('تمت إضافة الطالب بنجاح ✅')

      await loadStudents()
    } catch {
      setFormError('تعذر الاتصال، حاول مرة أخرى')
    } finally {
      setAddingStudent(false)
    }
  }

  const toggleStudent = async (student: Student) => {
    setUpdatingStudentId(student.id)
    setFormError('')
    setFormSuccess('')

    try {
      const response = await fetch('/api/admin-students', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: student.id,
          isActive: !student.is_active,
        }),
      })

      const data = await response.json()

      if (response.status === 401) {
        setIsAdmin(false)
        return
      }

      if (!response.ok || !data.success) {
        setFormError(
          data.message ||
            data.error ||
            'تعذر تحديث حالة الطالب'
        )
        return
      }

      setStudents((currentStudents) =>
        currentStudents.map((item) =>
          item.id === student.id ? data.student : item
        )
      )
    } catch {
      setFormError('تعذر تحديث حالة الطالب')
    } finally {
      setUpdatingStudentId(null)
    }
  }

  const resetDevice = async (student: Student) => {
    if (!student.device_id) {
      setFormError(
        'هذا الطالب لا يوجد لديه جهاز مرتبط'
      )
      setFormSuccess('')
      return
    }

    const confirmed = window.confirm(
      `هل تريد إعادة تعيين جهاز الطالب ${student.name}؟\n\nبعد التأكيد سيتم إلغاء ربط الجهاز الحالي، وأول جهاز يدخل بالكود سيصبح الجهاز الجديد.`
    )

    if (!confirmed) {
      return
    }

    setResettingDeviceId(student.id)
    setFormError('')
    setFormSuccess('')

    try {
      const response = await fetch('/api/admin-students', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: student.id,
          resetDevice: true,
        }),
      })

      const data = await response.json()

      if (response.status === 401) {
        setIsAdmin(false)
        return
      }

      if (!response.ok || !data.success) {
        setFormError(
          data.message ||
            data.error ||
            'تعذر إعادة تعيين الجهاز'
        )
        return
      }

      setStudents((currentStudents) =>
        currentStudents.map((item) =>
          item.id === student.id ? data.student : item
        )
      )

      setFormSuccess(
        `تمت إعادة تعيين جهاز ${student.name} بنجاح ✅`
      )
    } catch {
      setFormError('تعذر إعادة تعيين الجهاز')
    } finally {
      setResettingDeviceId(null)
    }
  }

  const startEditing = (student: Student) => {
    setEditingStudentId(student.id)
    setEditName(student.name)
    setEditAccessCode(student.access_code)

    if (student.expires_at) {
      setEditExpiresAt(
        new Date(student.expires_at)
          .toISOString()
          .slice(0, 10)
      )
    } else {
      setEditExpiresAt('')
    }

    setEditError('')
    setEditSuccess('')
  }

  const cancelEditing = () => {
    setEditingStudentId(null)
    setEditName('')
    setEditAccessCode('')
    setEditExpiresAt('')
    setEditError('')
    setEditSuccess('')
  }

  const saveStudentEdit = async (studentId: number) => {
    if (!editName.trim()) {
      setEditError('أدخل اسم الطالب')
      return
    }

    if (!editAccessCode.trim()) {
      setEditError('أدخل كود الطالب')
      return
    }

    if (editAccessCode.trim().length < 6) {
      setEditError('الكود يجب أن يكون 6 خانات على الأقل')
      return
    }

    setSavingEdit(true)
    setEditError('')
    setEditSuccess('')

    try {
      const response = await fetch('/api/admin-students', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          name: editName.trim(),
          accessCode: editAccessCode.trim(),
          expiresAt: editExpiresAt || null,
        }),
      })

      const data = await response.json()

      if (response.status === 401) {
        setIsAdmin(false)
        return
      }

      if (!response.ok || !data.success) {
        setEditError(
          data.message ||
            data.error ||
            'تعذر تعديل بيانات الطالب'
        )
        return
      }

      setStudents((currentStudents) =>
        currentStudents.map((item) =>
          item.id === studentId ? data.student : item
        )
      )

      setEditSuccess('تم حفظ التعديلات بنجاح ✅')

      setTimeout(() => {
        setEditingStudentId(null)
        setEditSuccess('')
      }, 700)
    } catch {
      setEditError('تعذر الاتصال، حاول مرة أخرى')
    } finally {
      setSavingEdit(false)
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) {
      return 'بدون تاريخ انتهاء'
    }

    return new Intl.DateTimeFormat('ar-IQ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(date))
  }

  if (checkingSession) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-black px-4 text-white"
      >
        <div className="text-center">
          <div className="text-4xl">🔐</div>

          <p className="mt-4 text-zinc-400">
            جاري التحقق من جلسة الإدارة...
          </p>
        </div>
      </main>
    )
  }

  if (!isAdmin) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-black px-4 text-white"
      >
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="text-center">
            <div className="text-4xl">🔐</div>

            <h1 className="mt-4 text-3xl font-bold">
              لوحة الإدارة
            </h1>

            <p className="mt-3 text-zinc-400">
              خاصة بالأستاذ حيدر محمد
            </p>
          </div>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                login()
              }
            }}
            placeholder="كلمة مرور الإدارة"
            autoComplete="current-password"
            disabled={loginLoading}
            className="mt-7 w-full rounded-xl border border-zinc-700 bg-black px-4 py-4 text-center text-lg outline-none focus:border-yellow-400 disabled:opacity-50"
          />

          {loginError && (
            <p className="mt-3 text-center text-sm text-red-400">
              {loginError}
            </p>
          )}

          <button
            type="button"
            onClick={login}
            disabled={loginLoading}
            className="mt-4 w-full rounded-xl bg-yellow-400 px-4 py-4 text-lg font-bold text-black disabled:opacity-50"
          >
            {loginLoading
              ? 'جاري التحقق...'
              : 'دخول لوحة الإدارة'}
          </button>
        </div>
      </main>
    )
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-black px-4 py-8 text-white"
    >
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-yellow-400/30 bg-zinc-950 p-6">
          <p className="text-sm font-bold text-yellow-400">
            لوحة الإدارة
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            أهلاً أستاذ حيدر 👋
          </h1>

          <p className="mt-3 text-zinc-400">
            إدارة طلاب الخاص والاشتراكات.
          </p>
        </div>

        <section className="mt-6 rounded-2xl border border-yellow-400/30 bg-zinc-950 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">
                🎥 إدارة المحاضرات الخاصة
              </h2>

              <p className="mt-1 text-sm text-zinc-400">
                إضافة روابط محاضرات طلاب الخاص
              </p>
            </div>

            <button
              type="button"
              onClick={loadLectures}
              disabled={lecturesLoading}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold disabled:opacity-50"
            >
              {lecturesLoading ? 'جاري التحديث...' : 'تحديث'}
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                الفصل
              </label>

              <input
                type="text"
                value={lectureChapter}
                onChange={(e) =>
                  setLectureChapter(e.target.value)
                }
                placeholder="مثال: الفصل الأول"
                className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                الموضوع
              </label>

              <input
                type="text"
                value={lectureTopic}
                onChange={(e) =>
                  setLectureTopic(e.target.value)
                }
                placeholder="مثال: القطع المكافئ"
                className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                اسم الدرس
              </label>

              <input
                type="text"
                value={lectureTitle}
                onChange={(e) =>
                  setLectureTitle(e.target.value)
                }
                placeholder="مثال: الدرس الأول"
                className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                ترتيب الدرس
              </label>

              <input
                type="number"
                value={lectureSortOrder}
                onChange={(e) =>
                  setLectureSortOrder(e.target.value)
                }
                placeholder="مثال: 1"
                min="0"
                className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-zinc-400">
                رابط محاضرة YouTube
              </label>

              <input
                type="url"
                value={lectureVideoUrl}
                onChange={(e) =>
                  setLectureVideoUrl(e.target.value)
                }
                placeholder="الصق رابط البث أو الفيديو هنا"
                className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
              />
            </div>
          </div>

          {lectureError && (
            <p className="mt-4 text-sm text-red-400">
              {lectureError}
            </p>
          )}

          {lectureSuccess && (
            <p className="mt-4 text-sm text-green-400">
              {lectureSuccess}
            </p>
          )}

          <button
            type="button"
            onClick={addLecture}
            disabled={addingLecture}
            className="mt-5 w-full rounded-xl bg-yellow-400 px-5 py-4 font-bold text-black disabled:opacity-50 md:w-auto"
          >
            {addingLecture
              ? 'جاري إضافة المحاضرة...'
              : 'إضافة المحاضرة'}
          </button>

          <div className="mt-8 border-t border-zinc-800 pt-6">
            <h3 className="text-xl font-bold">
              المحاضرات المضافة
            </h3>

            <p className="mt-1 text-sm text-zinc-400">
              العدد: {lectures.length}
            </p>

            {lecturesLoading && lectures.length === 0 ? (
              <p className="mt-5 text-zinc-400">
                جاري تحميل المحاضرات...
              </p>
            ) : lectures.length === 0 ? (
              <p className="mt-5 text-zinc-400">
                لا توجد محاضرات مضافة حالياً.
              </p>
            ) : (
              <div className="mt-5 space-y-3">
                {lectures.map((lecture) => (
                  <div
                    key={lecture.id}
                    className="rounded-xl border border-zinc-800 bg-black p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-bold text-yellow-400">
                          {lecture.chapter}
                        </p>

                        <p className="mt-1 text-sm text-zinc-400">
                          {lecture.topic}
                        </p>

                        <h4 className="mt-2 text-lg font-bold">
                          {lecture.title}
                        </h4>

                        <p className="mt-1 text-sm text-zinc-500">
                          الترتيب: {lecture.sort_order}
                        </p>

                        <a
                          href={lecture.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-block text-sm font-bold text-blue-400 underline"
                        >
                          فتح رابط المحاضرة
                        </a>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={
                            lecture.is_active
                              ? 'rounded-full bg-green-500/10 px-3 py-2 text-sm font-bold text-green-400'
                              : 'rounded-full bg-red-500/10 px-3 py-2 text-sm font-bold text-red-400'
                          }
                        >
                          {lecture.is_active
                            ? 'ظاهرة'
                            : 'مخفية'}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            toggleLecture(lecture)
                          }
                          disabled={
                            updatingLectureId === lecture.id
                          }
                          className={
                            lecture.is_active
                              ? 'rounded-xl border border-red-500/40 px-4 py-2 text-sm font-bold text-red-400 disabled:opacity-50'
                              : 'rounded-xl border border-green-500/40 px-4 py-2 text-sm font-bold text-green-400 disabled:opacity-50'
                          }
                        >
                          {updatingLectureId === lecture.id
                            ? 'جاري التحديث...'
                            : lecture.is_active
                              ? 'إخفاء المحاضرة'
                              : 'إظهار المحاضرة'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
<AdminQuizzes />
<AdminStudyPlan />
<AdminWeeklyExams />
<AdminMinisterialReviews />
<AdminBasicLessons />
        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-2xl font-bold">
            إضافة طالب جديد
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                اسم الطالب
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: أحمد محمد"
                className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                كود الاشتراك
              </label>

              <input
                type="text"
                value={accessCode}
                onChange={(e) =>
                  setAccessCode(e.target.value)
                }
                placeholder="6 خانات أو أكثر"
                className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                انتهاء الاشتراك
              </label>

              <input
                type="date"
                value={expiresAt}
                onChange={(e) =>
                  setExpiresAt(e.target.value)
                }
                className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
              />
            </div>
          </div>

          {formError && (
            <p className="mt-4 text-sm text-red-400">
              {formError}
            </p>
          )}

          {formSuccess && (
            <p className="mt-4 text-sm text-green-400">
              {formSuccess}
            </p>
          )}

          <button
            type="button"
            onClick={addStudent}
            disabled={addingStudent}
            className="mt-5 w-full rounded-xl bg-yellow-400 px-5 py-4 font-bold text-black disabled:opacity-50 md:w-auto"
          >
            {addingStudent
              ? 'جاري الإضافة...'
              : 'إضافة الطالب'}
          </button>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">
                طلاب الخاص
              </h2>

              <p className="mt-1 text-sm text-zinc-400">
                العدد: {students.length}
              </p>
            </div>

            <button
              type="button"
              onClick={loadStudents}
              disabled={studentsLoading}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold disabled:opacity-50"
            >
              تحديث
            </button>
          </div>

          {studentsLoading && students.length === 0 ? (
            <p className="mt-6 text-zinc-400">
              جاري تحميل الطلاب...
            </p>
          ) : students.length === 0 ? (
            <p className="mt-6 text-zinc-400">
              لا يوجد طلاب حالياً.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="rounded-xl border border-zinc-800 bg-black p-4"
                >
                  {editingStudentId === student.id ? (
                    <div>
                      <h3 className="text-lg font-bold text-yellow-400">
                        تعديل بيانات الطالب
                      </h3>

                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) =>
                            setEditName(e.target.value)
                          }
                          placeholder="اسم الطالب"
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-yellow-400"
                        />

                        <input
                          type="text"
                          value={editAccessCode}
                          onChange={(e) =>
                            setEditAccessCode(e.target.value)
                          }
                          placeholder="كود الاشتراك"
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-yellow-400"
                        />

                        <input
                          type="date"
                          value={editExpiresAt}
                          onChange={(e) =>
                            setEditExpiresAt(e.target.value)
                          }
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-yellow-400"
                        />
                      </div>

                      {editError && (
                        <p className="mt-3 text-sm text-red-400">
                          {editError}
                        </p>
                      )}

                      {editSuccess && (
                        <p className="mt-3 text-sm text-green-400">
                          {editSuccess}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            saveStudentEdit(student.id)
                          }
                          disabled={savingEdit}
                          className="rounded-xl bg-yellow-400 px-4 py-2 font-bold text-black disabled:opacity-50"
                        >
                          {savingEdit
                            ? 'جاري الحفظ...'
                            : 'حفظ التعديلات'}
                        </button>

                        <button
                          type="button"
                          onClick={cancelEditing}
                          disabled={savingEdit}
                          className="rounded-xl border border-zinc-700 px-4 py-2 font-bold text-zinc-300 disabled:opacity-50"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-bold">
                          {student.name}
                        </h3>

                        <p className="mt-1 text-sm text-zinc-400">
                          الكود: {student.access_code}
                        </p>

                        <p className="mt-1 text-sm text-zinc-500">
                          الانتهاء:{' '}
                          {formatDate(student.expires_at)}
                        </p>

                        <p className="mt-1 text-sm">
                          {student.device_id ? (
                            <span className="text-green-400">
                              🔒 الجهاز مرتبط
                            </span>
                          ) : (
                            <span className="text-zinc-500">
                              📱 لا يوجد جهاز مرتبط
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={
                            student.is_active
                              ? 'inline-block rounded-full bg-green-500/10 px-3 py-2 text-sm font-bold text-green-400'
                              : 'inline-block rounded-full bg-red-500/10 px-3 py-2 text-sm font-bold text-red-400'
                          }
                        >
                          {student.is_active
                            ? 'فعال'
                            : 'متوقف'}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            startEditing(student)
                          }
                          className="rounded-xl border border-yellow-400/40 px-4 py-2 text-sm font-bold text-yellow-400"
                        >
                          ✏️ تعديل
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleStudent(student)
                          }
                          disabled={
                            updatingStudentId === student.id
                          }
                          className={
                            student.is_active
                              ? 'rounded-xl border border-red-500/40 px-4 py-2 text-sm font-bold text-red-400 disabled:opacity-50'
                              : 'rounded-xl border border-green-500/40 px-4 py-2 text-sm font-bold text-green-400 disabled:opacity-50'
                          }
                        >
                          {updatingStudentId === student.id
                            ? 'جاري التحديث...'
                            : student.is_active
                              ? 'إيقاف الطالب'
                              : 'تفعيل الطالب'}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            resetDevice(student)
                          }
                          disabled={
                            resettingDeviceId === student.id ||
                            !student.device_id
                          }
                          className="rounded-xl border border-blue-500/40 px-4 py-2 text-sm font-bold text-blue-400 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {resettingDeviceId === student.id
                            ? 'جاري إعادة التعيين...'
                            : '🔄 إعادة تعيين الجهاز'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}