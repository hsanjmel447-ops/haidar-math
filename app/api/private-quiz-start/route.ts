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
    new Date(student.expires_at).getTime() <= Date.now()
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

    if (!Number.isInteger(quizId) || quizId < 1) {
      return NextResponse.json(
        { error: 'رقم الاختبار غير صحيح' },
        { status: 400 }
      )
    }

    const { data: quiz, error: quizError } =
      await supabaseAdmin
        .from('private_quizzes')
        .select(
          'id, is_active, duration_minutes, max_attempts'
        )
        .eq('id', quizId)
        .maybeSingle()

    if (quizError) {
      console.error(
        'LOAD QUIZ ERROR:',
        quizError
      )

      return NextResponse.json(
        { error: 'تعذر تحميل الاختبار' },
        { status: 500 }
      )
    }

    if (!quiz || !quiz.is_active) {
      return NextResponse.json(
        {
          error:
            'الاختبار غير موجود أو غير متاح',
        },
        { status: 404 }
      )
    }

    const durationMinutes = Number(
      quiz.duration_minutes ?? 0
    )

    const maxAttempts = Math.max(
      Number(quiz.max_attempts ?? 1),
      1
    )

    /*
      أولاً نبحث عن محاولة مفتوحة.

      إذا كانت ما زالت ضمن الوقت نرجعها نفسها
      حتى تحديث الصفحة لا يبدأ محاولة جديدة.

      إذا انتهى وقتها نغلقها تلقائياً.
    */
    const {
      data: openAttempt,
      error: openAttemptError,
    } = await supabaseAdmin
      .from('private_quiz_attempts')
      .select(
        'id, started_at, completed_at'
      )
      .eq('quiz_id', quizId)
      .eq('student_id', auth.student.id)
      .is('completed_at', null)
      .order('started_at', {
        ascending: false,
      })
      .limit(1)
      .maybeSingle()

    if (openAttemptError) {
      console.error(
        'LOAD OPEN ATTEMPT ERROR:',
        openAttemptError
      )

      return NextResponse.json(
        { error: 'تعذر التحقق من المحاولة الحالية' },
        { status: 500 }
      )
    }

    if (openAttempt) {
      const startedAt = new Date(
        openAttempt.started_at
      ).getTime()

      if (!Number.isFinite(startedAt)) {
        return NextResponse.json(
          {
            error:
              'وقت بدء المحاولة الحالية غير صالح',
          },
          { status: 500 }
        )
      }

      if (durationMinutes === 0) {
        return NextResponse.json({
          success: true,
          attemptId: openAttempt.id,
          startedAt: openAttempt.started_at,
          durationMinutes,
          expiresAt: null,
          resumed: true,
        })
      }

      const expiresAt =
        startedAt + durationMinutes * 60 * 1000

      if (Date.now() <= expiresAt) {
        return NextResponse.json({
          success: true,
          attemptId: openAttempt.id,
          startedAt: openAttempt.started_at,
          durationMinutes,
          expiresAt,
          resumed: true,
        })
      }

      /*
        الوقت انتهى ولم يتم التسليم.
        نغلق المحاولة حتى لا يبقى الطالب
        عالقاً بها إلى الأبد.
      */
      const {
        error: closeExpiredError,
      } = await supabaseAdmin
        .from('private_quiz_attempts')
        .update({
          completed_at: new Date(
            expiresAt
          ).toISOString(),
          score: 0,
          percentage: 0,
          passed: false,
        })
        .eq('id', openAttempt.id)
        .eq('quiz_id', quizId)
        .eq('student_id', auth.student.id)
        .is('completed_at', null)

      if (closeExpiredError) {
        console.error(
          'CLOSE EXPIRED ATTEMPT ERROR:',
          closeExpiredError
        )

        return NextResponse.json(
          {
            error:
              'تعذر إغلاق المحاولة المنتهية',
          },
          { status: 500 }
        )
      }
    }

    /*
      نحسب المحاولات المكتملة بعد إغلاق
      أي محاولة انتهى وقتها.
    */
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
        'COUNT ATTEMPTS ERROR:',
        countError
      )

      return NextResponse.json(
        { error: 'تعذر التحقق من عدد المحاولات' },
        { status: 500 }
      )
    }

    const attemptsUsed = count ?? 0

    if (attemptsUsed >= maxAttempts) {
      return NextResponse.json(
        {
          error:
            'لقد استخدمت جميع المحاولات المتاحة لهذا الاختبار',
          attemptsUsed,
          attemptsRemaining: 0,
        },
        { status: 403 }
      )
    }

    /*
      لا توجد محاولة صالحة مفتوحة،
      وما زالت هناك محاولة متاحة:
      ننشئ محاولة جديدة.
    */
    const startedAt = new Date().toISOString()

    const {
      data: attempt,
      error: attemptError,
    } = await supabaseAdmin
      .from('private_quiz_attempts')
      .insert({
        quiz_id: quizId,
        student_id: auth.student.id,
        started_at: startedAt,
        completed_at: null,
        score: 0,
        total_points: 0,
        percentage: 0,
        passed: false,
        answers: null,
      })
      .select('id, started_at')
      .single()

    if (attemptError || !attempt) {
      console.error(
        'CREATE QUIZ ATTEMPT ERROR:',
        attemptError
      )

      return NextResponse.json(
        { error: 'تعذر بدء الاختبار' },
        { status: 500 }
      )
    }

    const startTime = new Date(
      attempt.started_at
    ).getTime()

    const expiresAt =
      durationMinutes > 0
        ? startTime +
          durationMinutes * 60 * 1000
        : null

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      startedAt: attempt.started_at,
      durationMinutes,
      expiresAt,
      resumed: false,
      attemptsUsed,
      attemptsRemaining:
        maxAttempts - attemptsUsed,
    })
  } catch (error) {
    console.error(
      'START PRIVATE QUIZ ERROR:',
      error
    )

    return NextResponse.json(
      { error: 'حدث خطأ أثناء بدء الاختبار' },
      { status: 500 }
    )
  }
}