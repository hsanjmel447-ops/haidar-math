import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'

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

export async function POST(request: Request) {
  const auth = await getStudent(request)

  if ('error' in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    )
  }

  try {
    const body = await request.json()
    const examId = Number(body.examId)

    if (
      !Number.isInteger(examId) ||
      examId <= 0
    ) {
      return NextResponse.json(
        { error: 'الاختبار غير صالح' },
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
      data: submission,
      error: submissionError,
    } = await supabaseAdmin
      .from('weekly_exam_submissions')
      .select('id, status')
      .eq('exam_id', examId)
      .eq('student_id', auth.student.id)
      .maybeSingle()

    if (submissionError || !submission) {
      return NextResponse.json(
        {
          error:
            'لم يتم بدء حل هذا الاختبار',
        },
        { status: 400 }
      )
    }

    if (submission.status !== 'draft') {
      return NextResponse.json(
        {
          error:
            submission.status === 'graded'
              ? 'تم تصحيح هذا الاختبار مسبقاً'
              : 'تم تسليم هذا الاختبار مسبقاً',
        },
        { status: 400 }
      )
    }

    const {
      data: questions,
      error: questionsError,
    } = await supabaseAdmin
      .from('weekly_exam_questions')
      .select('id')
      .eq('exam_id', examId)

    if (questionsError) {
      return NextResponse.json(
        {
          error:
            'تعذر التحقق من أسئلة الاختبار',
        },
        { status: 500 }
      )
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        {
          error:
            'لا توجد أسئلة في هذا الاختبار',
        },
        { status: 400 }
      )
    }

    const {
      data: answers,
      error: answersError,
    } = await supabaseAdmin
      .from('weekly_exam_answers')
      .select('id, question_id')
      .eq('submission_id', submission.id)

    if (answersError) {
      return NextResponse.json(
        {
          error:
            'تعذر التحقق من حلول الاختبار',
        },
        { status: 500 }
      )
    }

    const answerIds = (answers ?? []).map(
      (answer) => answer.id
    )

    let files: Array<{
      answer_id: number
    }> = []

    if (answerIds.length > 0) {
      const {
        data: fileRows,
        error: filesError,
      } = await supabaseAdmin
        .from('weekly_exam_answer_files')
        .select('answer_id')
        .in('answer_id', answerIds)

      if (filesError) {
        return NextResponse.json(
          {
            error:
              'تعذر التحقق من صور الحل',
          },
          { status: 500 }
        )
      }

      files = fileRows ?? []
    }

    const answerByQuestion = new Map(
      (answers ?? []).map((answer) => [
        answer.question_id,
        answer.id,
      ])
    )

    const missingQuestions = questions.filter(
      (question) => {
        const answerId = answerByQuestion.get(
          question.id
        )

        if (!answerId) return true

        return !files.some(
          (file) => file.answer_id === answerId
        )
      }
    )

    if (missingQuestions.length > 0) {
      return NextResponse.json(
        {
          error:
            'يجب رفع صورة حل واحدة على الأقل لكل سؤال قبل التسليم النهائي',
        },
        { status: 400 }
      )
    }

    const submittedAt =
      new Date().toISOString()

    const { data, error } =
      await supabaseAdmin
        .from('weekly_exam_submissions')
        .update({
          status: 'submitted',
          submitted_at: submittedAt,
        })
        .eq('id', submission.id)
        .eq('status', 'draft')
        .select(
          'id, status, submitted_at'
        )
        .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            'تعذر تسليم الاختبار',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      submission: data,
    })
  } catch {
    return NextResponse.json(
      {
        error:
          'حدث خطأ أثناء تسليم الاختبار',
      },
      { status: 500 }
    )
  }
}