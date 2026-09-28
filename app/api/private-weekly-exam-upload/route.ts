import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'

const BUCKET = 'weekly-exam-files'
const MAX_FILE_SIZE = 10 * 1024 * 1024

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
])

async function getStudent(request: Request) {
  const cookieHeader =
    request.headers.get('cookie') ?? ''

  const match = cookieHeader.match(
    /(?:^|;\s*)private_student_session=([^;]+)/
  )

  if (!match) {
    return {
      error: 'يجب تسجيل الدخول أولاً',
      status: 401,
    }
  }

  const token = decodeURIComponent(match[1])

  const [studentId, expiresAt, signature] =
    token.split('.')

  if (!studentId || !expiresAt || !signature) {
    return {
      error: 'الجلسة غير صالحة',
      status: 401,
    }
  }

  const id = Number(studentId)
  const expires = Number(expiresAt)

  if (
    !Number.isInteger(id) ||
    id < 1 ||
    !Number.isFinite(expires) ||
    Date.now() > expires
  ) {
    return {
      error: 'انتهت جلسة الدخول',
      status: 401,
    }
  }

  const secret =
    process.env.PRIVATE_SESSION_SECRET

  if (!secret) {
    return {
      error: 'خطأ في إعدادات الخادم',
      status: 500,
    }
  }

  const expectedSignature = createHmac(
    'sha256',
    secret
  )
    .update(`${studentId}.${expiresAt}`)
    .digest('hex')

  try {
    const signatureBuffer =
      Buffer.from(signature, 'hex')

    const expectedBuffer =
      Buffer.from(expectedSignature, 'hex')

    if (
      signatureBuffer.length !==
        expectedBuffer.length ||
      !timingSafeEqual(
        signatureBuffer,
        expectedBuffer
      )
    ) {
      return {
        error: 'الجلسة غير صالحة',
        status: 401,
      }
    }
  } catch {
    return {
      error: 'الجلسة غير صالحة',
      status: 401,
    }
  }

  const deviceId =
    request.headers.get('x-device-id')

  if (!deviceId) {
    return {
      error: 'تعذر التحقق من الجهاز',
      status: 401,
    }
  }

  const { data: student, error } =
    await supabaseAdmin
      .from('private_students')
      .select(
        'id, name, is_active, expires_at, device_id'
      )
      .eq('id', id)
      .maybeSingle()

  if (error || !student) {
    return {
      error: 'الطالب غير موجود',
      status: 401,
    }
  }

  if (!student.is_active) {
    return {
      error: 'الاشتراك متوقف',
      status: 403,
    }
  }

  if (
    student.expires_at &&
    new Date(student.expires_at).getTime() <=
      Date.now()
  ) {
    return {
      error: 'انتهى الاشتراك',
      status: 403,
    }
  }

  if (
    !student.device_id ||
    student.device_id !== deviceId
  ) {
    return {
      error:
        'هذه الجلسة غير مرتبطة بالجهاز المعتمد',
      status: 403,
    }
  }

  return {
    student,
    status: 200,
  }
}

function getExtension(file: File) {
  const extensionFromName =
    file.name.split('.').pop()?.toLowerCase()

  if (
    extensionFromName &&
    /^[a-z0-9]+$/.test(extensionFromName)
  ) {
    return extensionFromName
  }

  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'image/heic') return 'heic'
  if (file.type === 'image/heif') return 'heif'

  return 'jpg'
}

export async function POST(request: Request) {
  const auth = await getStudent(request)

  if ('error' in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    )
  }

  try {
    const formData = await request.formData()

    const examId = Number(formData.get('examId'))
    const questionId = Number(
      formData.get('questionId')
    )

    const fileValue = formData.get('file')

    if (
      !Number.isInteger(examId) ||
      examId <= 0 ||
      !Number.isInteger(questionId) ||
      questionId <= 0
    ) {
      return NextResponse.json(
        { error: 'بيانات السؤال غير صالحة' },
        { status: 400 }
      )
    }

    if (!(fileValue instanceof File)) {
      return NextResponse.json(
        { error: 'اختر صورة الحل أولاً' },
        { status: 400 }
      )
    }

    if (fileValue.size <= 0) {
      return NextResponse.json(
        { error: 'الصورة فارغة' },
        { status: 400 }
      )
    }

    if (fileValue.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error:
            'حجم الصورة يجب ألا يتجاوز 10 ميغابايت',
        },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.has(fileValue.type)) {
      return NextResponse.json(
        {
          error:
            'صيغة الصورة غير مدعومة',
        },
        { status: 400 }
      )
    }

    const { data: exam, error: examError } =
      await supabaseAdmin
        .from('weekly_exams')
        .select(
          'id, is_active, starts_at, deadline_at'
        )
        .eq('id', examId)
        .maybeSingle()

    if (
      examError ||
      !exam ||
      !exam.is_active
    ) {
      return NextResponse.json(
        {
          error:
            'الاختبار غير موجود أو غير مفعّل',
        },
        { status: 404 }
      )
    }

    const now = Date.now()

    if (
      exam.starts_at &&
      new Date(exam.starts_at).getTime() > now
    ) {
      return NextResponse.json(
        { error: 'الاختبار لم يبدأ بعد' },
        { status: 403 }
      )
    }

    if (
      exam.deadline_at &&
      new Date(exam.deadline_at).getTime() < now
    ) {
      return NextResponse.json(
        { error: 'انتهى موعد تسليم الاختبار' },
        { status: 403 }
      )
    }

    const {
      data: question,
      error: questionError,
    } = await supabaseAdmin
      .from('weekly_exam_questions')
      .select('id, exam_id')
      .eq('id', questionId)
      .eq('exam_id', examId)
      .maybeSingle()

    if (questionError || !question) {
      return NextResponse.json(
        {
          error:
            'السؤال غير موجود في هذا الاختبار',
        },
        { status: 404 }
      )
    }

    let {
      data: submission,
      error: submissionError,
    } = await supabaseAdmin
      .from('weekly_exam_submissions')
      .select('id, status')
      .eq('exam_id', examId)
      .eq('student_id', auth.student.id)
      .maybeSingle()

    if (submissionError) {
      return NextResponse.json(
        {
          error:
            'تعذر التحقق من تسليم الاختبار',
        },
        { status: 500 }
      )
    }

    if (!submission) {
      const {
        data: createdSubmission,
        error: createSubmissionError,
      } = await supabaseAdmin
        .from('weekly_exam_submissions')
        .insert({
          exam_id: examId,
          student_id: auth.student.id,
          status: 'draft',
          final_score: 0,
          earned_points: 0,
        })
        .select('id, status')
        .single()

      if (
        createSubmissionError ||
        !createdSubmission
      ) {
        return NextResponse.json(
          {
            error:
              'تعذر بدء حل الاختبار',
          },
          { status: 500 }
        )
      }

      submission = createdSubmission
    }

    if (submission.status !== 'draft') {
      return NextResponse.json(
        {
          error:
            'تم تسليم الاختبار ولا يمكن تعديل الحل',
        },
        { status: 403 }
      )
    }

    let { data: answer, error: answerError } =
      await supabaseAdmin
        .from('weekly_exam_answers')
        .select('id')
        .eq('submission_id', submission.id)
        .eq('question_id', questionId)
        .maybeSingle()

    if (answerError) {
      return NextResponse.json(
        {
          error:
            'تعذر تجهيز إجابة السؤال',
        },
        { status: 500 }
      )
    }

    if (!answer) {
      const {
        data: createdAnswer,
        error: createAnswerError,
      } = await supabaseAdmin
        .from('weekly_exam_answers')
        .insert({
          submission_id: submission.id,
          question_id: questionId,
        })
        .select('id')
        .single()

      if (createAnswerError || !createdAnswer) {
        return NextResponse.json(
          {
            error:
              'تعذر إنشاء إجابة السؤال',
          },
          { status: 500 }
        )
      }

      answer = createdAnswer
    }

    const {
      data: existingFiles,
      error: existingFilesError,
    } = await supabaseAdmin
      .from('weekly_exam_answer_files')
      .select('id, sort_order')
      .eq('answer_id', answer.id)
      .order('sort_order', {
        ascending: false,
      })
      .limit(1)

    if (existingFilesError) {
      return NextResponse.json(
        {
          error:
            'تعذر تجهيز صورة الحل',
        },
        { status: 500 }
      )
    }

    const nextSortOrder =
      existingFiles &&
      existingFiles.length > 0
        ? Number(existingFiles[0].sort_order) + 1
        : 0

    const extension = getExtension(fileValue)

    const fileName =
      `${Date.now()}-${crypto.randomUUID()}.${extension}`

    const filePath =
      `exam-${examId}/student-${auth.student.id}/question-${questionId}/${fileName}`

    const fileBuffer =
      Buffer.from(await fileValue.arrayBuffer())

    const {
      error: uploadError,
    } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath, fileBuffer, {
        contentType: fileValue.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json(
        {
          error:
            'تعذر رفع صورة الحل',
        },
        { status: 500 }
      )
    }

    const {
      data: savedFile,
      error: saveFileError,
    } = await supabaseAdmin
      .from('weekly_exam_answer_files')
      .insert({
        answer_id: answer.id,
        file_path: filePath,
        sort_order: nextSortOrder,
      })
      .select(
        'id, answer_id, file_path, sort_order'
      )
      .single()

    if (saveFileError) {
      await supabaseAdmin.storage
        .from(BUCKET)
        .remove([filePath])

      return NextResponse.json(
        {
          error:
            'تعذر حفظ صورة الحل',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      file: savedFile,
    })
  } catch {
    return NextResponse.json(
      {
        error:
          'حدث خطأ أثناء رفع صورة الحل',
      },
      { status: 500 }
    )
  }
}