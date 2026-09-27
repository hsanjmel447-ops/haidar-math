import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function getStudent(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''

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

  const secret = process.env.PRIVATE_SESSION_SECRET

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
    const signatureBuffer = Buffer.from(
      signature,
      'hex'
    )

    const expectedBuffer = Buffer.from(
      expectedSignature,
      'hex'
    )

    if (
      signatureBuffer.length !== expectedBuffer.length ||
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

export async function GET(request: Request) {
  const auth = await getStudent(request)

  if ('error' in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    )
  }

  const { searchParams } = new URL(request.url)
  const quizId = Number(searchParams.get('quizId'))

  if (!Number.isInteger(quizId) || quizId < 1) {
    return NextResponse.json(
      { error: 'رقم الاختبار غير صحيح' },
      { status: 400 }
    )
  }

  // نتأكد أن الاختبار موجود ومفعّل
  const { data: quiz, error: quizError } =
    await supabaseAdmin
      .from('private_quizzes')
      .select(
        `
        id,
        title,
        chapter,
        topic,
        description,
        duration_minutes,
        passing_score,
        show_result,
        max_attempts
        `
      )
      .eq('id', quizId)
      .eq('is_active', true)
      .maybeSingle()

  if (quizError) {
    console.error(
      'LOAD PRIVATE QUIZ ERROR:',
      quizError
    )

    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحميل الاختبار' },
      { status: 500 }
    )
  }

  if (!quiz) {
    return NextResponse.json(
      { error: 'الاختبار غير موجود أو غير متاح' },
      { status: 404 }
    )
  }

  // مهم:
  // لا نجلب correct_option ولا explanation
  // حتى لا تظهر الإجابات للطالب قبل التسليم.
  const { data: questions, error: questionsError } =
    await supabaseAdmin
      .from('private_quiz_questions')
      .select(
        `
        id,
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        sort_order,
        points
        `
      )
      .eq('quiz_id', quizId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

  if (questionsError) {
    console.error(
      'LOAD PRIVATE QUIZ QUESTIONS ERROR:',
      questionsError
    )

    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحميل أسئلة الاختبار' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    quiz,
    questions: questions ?? [],
  })
}