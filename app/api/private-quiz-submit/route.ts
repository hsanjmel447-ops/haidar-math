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

    const quizId = Number(body.quizId)
    const attemptId = Number(body.attemptId)
    const answers = body.answers

    if (!Number.isInteger(quizId) || quizId < 1) {
      return NextResponse.json(
        { error: 'رقم الاختبار غير صحيح' },
        { status: 400 }
      )
    }

    if (
      !Number.isInteger(attemptId) ||
      attemptId < 1
    ) {
      return NextResponse.json(
        { error: 'رقم المحاولة غير صحيح' },
        { status: 400 }
      )
    }

    if (
      !answers ||
      typeof answers !== 'object' ||
      Array.isArray(answers)
    ) {
      return NextResponse.json(
        { error: 'الإجابات غير صحيحة' },
        { status: 400 }
      )
    }

    const { data: quiz, error: quizError } =
      await supabaseAdmin
        .from('private_quizzes')
        .select(
          `
          id,
          title,
          is_active,
          duration_minutes,
          passing_score,
          show_result,
          max_attempts
          `
        )
        .eq('id', quizId)
        .maybeSingle()

    if (quizError) {
      console.error(
        'LOAD QUIZ ERROR:',
        quizError
      )

      return NextResponse.json(
        { error: 'حدث خطأ أثناء تحميل الاختبار' },
        { status: 500 }
      )
    }

    if (!quiz || !quiz.is_active) {
      return NextResponse.json(
        { error: 'الاختبار غير موجود أو غير متاح' },
        { status: 404 }
      )
    }

    // جلب نفس المحاولة التي بدأها الطالب
    const {
      data: attempt,
      error: attemptError,
    } = await supabaseAdmin
      .from('private_quiz_attempts')
      .select(
        'id, quiz_id, student_id, started_at, completed_at'
      )
      .eq('id', attemptId)
      .eq('quiz_id', quizId)
      .eq('student_id', auth.student.id)
      .maybeSingle()

    if (attemptError) {
      console.error(
        'LOAD ATTEMPT ERROR:',
        attemptError
      )

      return NextResponse.json(
        { error: 'تعذر التحقق من المحاولة' },
        { status: 500 }
      )
    }

    if (!attempt) {
      return NextResponse.json(
        { error: 'المحاولة غير موجودة' },
        { status: 404 }
      )
    }

    // منع تسليم نفس المحاولة مرتين
    if (attempt.completed_at) {
      return NextResponse.json(
        { error: 'تم تسليم هذه المحاولة مسبقًا' },
        { status: 409 }
      )
    }

    const durationMinutes = Number(
      quiz.duration_minutes ?? 0
    )

    // التحقق من وقت الاختبار على السيرفر
    if (durationMinutes > 0) {
      const startedAt = new Date(
        attempt.started_at
      ).getTime()

      if (!Number.isFinite(startedAt)) {
        return NextResponse.json(
          { error: 'وقت بدء الاختبار غير صالح' },
          { status: 500 }
        )
      }

      const expiresAt =
        startedAt + durationMinutes * 60 * 1000

      // سماح 30 ثانية فقط لتأخير الشبكة
      const gracePeriod = 30 * 1000

      if (Date.now() > expiresAt + gracePeriod) {
        return NextResponse.json(
          {
            error:
              'انتهى وقت الاختبار ولا يمكن تسليم الإجابات',
          },
          { status: 403 }
        )
      }
    }

    const {
      data: questions,
      error: questionsError,
    } = await supabaseAdmin
      .from('private_quiz_questions')
      .select(
        'id, correct_option, points, explanation'
      )
      .eq('quiz_id', quizId)

    if (questionsError) {
      console.error(
        'LOAD QUIZ ANSWERS ERROR:',
        questionsError
      )

      return NextResponse.json(
        { error: 'حدث خطأ أثناء تصحيح الاختبار' },
        { status: 500 }
      )
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'هذا الاختبار لا يحتوي على أسئلة' },
        { status: 400 }
      )
    }

    let score = 0
    let totalPoints = 0

    const review = questions.map((question) => {
      const points = Number(question.points ?? 1)

      totalPoints += points

      const studentAnswer = String(
        answers[String(question.id)] ?? ''
      )
        .trim()
        .toUpperCase()

      const correctAnswer = String(
        question.correct_option ?? ''
      )
        .trim()
        .toUpperCase()

      const isCorrect =
        studentAnswer !== '' &&
        studentAnswer === correctAnswer

      if (isCorrect) {
        score += points
      }

      return {
        questionId: question.id,
        selectedOption: studentAnswer || null,
        correctOption: correctAnswer,
        isCorrect,
        explanation: question.explanation ?? null,
      }
    })

    const percentage =
      totalPoints > 0
        ? Math.round(
            (score / totalPoints) * 100
          )
        : 0

    const passingScore = Number(
      quiz.passing_score ?? 50
    )

    const passed =
      percentage >= passingScore

    const completedAt =
      new Date().toISOString()

    // تحديث نفس المحاولة بدل إنشاء محاولة جديدة
    const {
      data: savedAttempt,
      error: saveError,
    } = await supabaseAdmin
      .from('private_quiz_attempts')
      .update({
        completed_at: completedAt,
        score,
        total_points: totalPoints,
        percentage,
        passed,
        answers,
      })
      .eq('id', attemptId)
      .eq('quiz_id', quizId)
      .eq('student_id', auth.student.id)
      .is('completed_at', null)
      .select('id, completed_at')
      .maybeSingle()

    if (saveError) {
      console.error(
        'SAVE QUIZ RESULT ERROR:',
        saveError
      )

      return NextResponse.json(
        { error: 'تعذر حفظ نتيجة الاختبار' },
        { status: 500 }
      )
    }

    if (!savedAttempt) {
      return NextResponse.json(
        {
          error:
            'تعذر تسليم المحاولة أو تم تسليمها مسبقًا',
        },
        { status: 409 }
      )
    }

    // حساب عدد المحاولات المكتملة بعد التسليم
    const {
      count,
      error: countError,
    } = await supabaseAdmin
      .from('private_quiz_attempts')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('quiz_id', quizId)
      .eq('student_id', auth.student.id)
      .not('completed_at', 'is', null)

    if (countError) {
      console.error(
        'COUNT COMPLETED ATTEMPTS ERROR:',
        countError
      )
    }

    const attemptsUsed = count ?? 1

    const attemptsRemaining = Math.max(
      Number(quiz.max_attempts ?? 1) -
        attemptsUsed,
      0
    )

    // الأستاذ اختار عدم إظهار النتيجة مباشرة
    if (!quiz.show_result) {
      return NextResponse.json({
        success: true,
        message: 'تم تسليم الاختبار بنجاح',
        attemptId: savedAttempt.id,
        attemptsUsed,
        attemptsRemaining,
      })
    }

    return NextResponse.json({
      success: true,
      message:
        'تم تسليم الاختبار وتصحيحه بنجاح',
      attemptId: savedAttempt.id,
      score,
      totalPoints,
      percentage,
      passed,
      attemptsUsed,
      attemptsRemaining,
      review,
    })
  } catch (error) {
    console.error(
      'SUBMIT PRIVATE QUIZ ERROR:',
      error
    )

    return NextResponse.json(
      { error: 'حدث خطأ أثناء تسليم الاختبار' },
      { status: 500 }
    )
  }
}