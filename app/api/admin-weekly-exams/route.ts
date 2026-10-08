
import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'

function isAdmin(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''

  const match = cookieHeader.match(
    /(?:^|;\s*)admin_session=([^;]+)/
  )

  if (!match) return false

  const token = decodeURIComponent(match[1])
  const [admin, expiresAt, signature] = token.split('.')

  if (
    admin !== 'admin' ||
    !expiresAt ||
    !signature
  ) {
    return false
  }

  const expires = Number(expiresAt)

  if (!Number.isFinite(expires) || Date.now() > expires) {
    return false
  }

  const secret = process.env.PRIVATE_SESSION_SECRET

  if (!secret) return false

  const payload = `admin.${expiresAt}`

  const expectedSignature = createHmac(
    'sha256',
    secret
  )
    .update(payload)
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
      expectedBuffer.length
    ) {
      return false
    }

    return timingSafeEqual(
      signatureBuffer,
      expectedBuffer
    )
  } catch {
    return false
  }
}

// فحص حالة اعتماد نتائج الاختبار
async function getExamApproval(examId: number) {
  const { data, error } = await supabaseAdmin
    .from('weekly_exams')
    .select(
      'id, results_approved, starts_at, deadline_at'
    )
    .eq('id', examId)
    .maybeSingle()

  if (error) {
    return {
      exam: null,
      response: NextResponse.json(
        { error: 'تعذر التحقق من حالة الاختبار' },
        { status: 500 }
      ),
    }
  }

  if (!data) {
    return {
      exam: null,
      response: NextResponse.json(
        { error: 'الاختبار غير موجود' },
        { status: 404 }
      ),
    }
  }

  return {
    exam: data,
    response: null,
  }
}

export async function GET(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: 'غير مصرح بالدخول' },
      { status: 401 }
    )
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('weekly_exams')
      .select('*')
      .order('week_number', { ascending: false })
      .order('id', { ascending: false })

    if (error) {
      return NextResponse.json(
        {
          error: 'تعذر تحميل الاختبارات الأسبوعية',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      exams: data ?? [],
    })
  } catch {
    return NextResponse.json(
      {
        error: 'حدث خطأ أثناء تحميل الاختبارات',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: 'غير مصرح بالدخول' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()

    const title = String(body.title ?? '').trim()
    const weekNumber = Number(body.weekNumber)
    const description = String(
      body.description ?? ''
    ).trim()

    const totalScore = Number(
      body.totalScore ?? 100
    )

    const pointsAvailable = Number(
      body.pointsAvailable ?? 100
    )

    const startsAt = body.startsAt
      ? String(body.startsAt)
      : null

    const deadlineAt = body.deadlineAt
      ? String(body.deadlineAt)
      : null

    if (!title) {
      return NextResponse.json(
        { error: 'عنوان الاختبار مطلوب' },
        { status: 400 }
      )
    }

    if (
      !Number.isInteger(weekNumber) ||
      weekNumber < 1
    ) {
      return NextResponse.json(
        { error: 'رقم الأسبوع غير صالح' },
        { status: 400 }
      )
    }

    if (
      !Number.isInteger(totalScore) ||
      totalScore <= 0
    ) {
      return NextResponse.json(
        { error: 'الدرجة الكلية غير صالحة' },
        { status: 400 }
      )
    }

    if (
      !Number.isInteger(pointsAvailable) ||
      pointsAvailable < 0
    ) {
      return NextResponse.json(
        { error: 'عدد النقاط غير صالح' },
        { status: 400 }
      )
    }

    if (
      startsAt &&
      Number.isNaN(Date.parse(startsAt))
    ) {
      return NextResponse.json(
        { error: 'موعد بدء الاختبار غير صالح' },
        { status: 400 }
      )
    }

    if (
      deadlineAt &&
      Number.isNaN(Date.parse(deadlineAt))
    ) {
      return NextResponse.json(
        { error: 'موعد انتهاء الاختبار غير صالح' },
        { status: 400 }
      )
    }

    if (
      startsAt &&
      deadlineAt &&
      new Date(deadlineAt).getTime() <=
        new Date(startsAt).getTime()
    ) {
      return NextResponse.json(
        {
          error:
            'موعد انتهاء الاختبار يجب أن يكون بعد موعد البدء',
        },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('weekly_exams')
      .insert({
        title,
        week_number: weekNumber,
        description: description || null,
        total_score: totalScore,
        points_available: pointsAvailable,
        starts_at: startsAt,
        deadline_at: deadlineAt,
        is_active: false,
        results_approved: false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        {
          error: 'تعذر إنشاء الاختبار الأسبوعي',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      exam: data,
    })
  } catch {
    return NextResponse.json(
      {
        error: 'حدث خطأ أثناء إنشاء الاختبار',
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: 'غير مصرح بالدخول' },
      { status: 401 }
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

    const check = await getExamApproval(examId)

    if (check.response) return check.response

    if (check.exam!.results_approved) {
      return NextResponse.json(
        {
          error:
            'تم اعتماد نتائج هذا الاختبار، ولا يمكن تعديل بياناته بعد الاعتماد',
        },
        { status: 403 }
      )
    }

    const updates: Record<string, unknown> = {}

    if (body.title !== undefined) {
      const title = String(body.title).trim()

      if (!title) {
        return NextResponse.json(
          { error: 'عنوان الاختبار مطلوب' },
          { status: 400 }
        )
      }

      updates.title = title
    }

    if (body.description !== undefined) {
      const description = String(
        body.description
      ).trim()

      updates.description = description || null
    }

    if (body.weekNumber !== undefined) {
      const weekNumber = Number(body.weekNumber)

      if (
        !Number.isInteger(weekNumber) ||
        weekNumber < 1
      ) {
        return NextResponse.json(
          { error: 'رقم الأسبوع غير صالح' },
          { status: 400 }
        )
      }

      updates.week_number = weekNumber
    }

    if (body.totalScore !== undefined) {
      const totalScore = Number(body.totalScore)

      if (
        !Number.isInteger(totalScore) ||
        totalScore <= 0
      ) {
        return NextResponse.json(
          { error: 'الدرجة الكلية غير صالحة' },
          { status: 400 }
        )
      }

      updates.total_score = totalScore
    }

    if (body.pointsAvailable !== undefined) {
      const pointsAvailable = Number(
        body.pointsAvailable
      )

      if (
        !Number.isInteger(pointsAvailable) ||
        pointsAvailable < 0
      ) {
        return NextResponse.json(
          { error: 'عدد النقاط غير صالح' },
          { status: 400 }
        )
      }

      updates.points_available = pointsAvailable
    }

    if (typeof body.isActive === 'boolean') {
      updates.is_active = body.isActive
    }

    if (body.startsAt !== undefined) {
      const startsAt = body.startsAt
        ? String(body.startsAt)
        : null

      if (
        startsAt &&
        Number.isNaN(Date.parse(startsAt))
      ) {
        return NextResponse.json(
          { error: 'موعد بدء الاختبار غير صالح' },
          { status: 400 }
        )
      }

      updates.starts_at = startsAt
    }

    if (body.deadlineAt !== undefined) {
      const deadlineAt = body.deadlineAt
        ? String(body.deadlineAt)
        : null

      if (
        deadlineAt &&
        Number.isNaN(Date.parse(deadlineAt))
      ) {
        return NextResponse.json(
          { error: 'موعد انتهاء الاختبار غير صالح' },
          { status: 400 }
        )
      }

      updates.deadline_at = deadlineAt
    }

    const finalStartsAt =
      body.startsAt !== undefined
        ? updates.starts_at
        : check.exam!.starts_at

    const finalDeadlineAt =
      body.deadlineAt !== undefined
        ? updates.deadline_at
        : check.exam!.deadline_at

    if (
      typeof finalStartsAt === 'string' &&
      typeof finalDeadlineAt === 'string' &&
      new Date(finalDeadlineAt).getTime() <=
        new Date(finalStartsAt).getTime()
    ) {
      return NextResponse.json(
        {
          error:
            'موعد انتهاء الاختبار يجب أن يكون بعد موعد البدء',
        },
        { status: 400 }
      )
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'لا توجد تعديلات' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('weekly_exams')
      .update(updates)
      .eq('id', examId)
      .eq('results_approved', false)
      .select()
      .maybeSingle()

    if (error) {
      return NextResponse.json(
        { error: 'تعذر تعديل الاختبار' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        {
          error:
            'تعذر تعديل الاختبار؛ ربما تم اعتماد نتائجه',
        },
        { status: 409 }
      )
    }

    return NextResponse.json({
      success: true,
      exam: data,
    })
  } catch {
    return NextResponse.json(
      {
        error: 'حدث خطأ أثناء تعديل الاختبار',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: 'غير مصرح بالدخول' },
      { status: 401 }
    )
  }

  try {
    const url = new URL(request.url)

    const examId = Number(
      url.searchParams.get('examId')
    )

    if (
      !Number.isInteger(examId) ||
      examId <= 0
    ) {
      return NextResponse.json(
        { error: 'الاختبار غير صالح' },
        { status: 400 }
      )
    }

    const check = await getExamApproval(examId)

    if (check.response) return check.response

    if (check.exam!.results_approved) {
      return NextResponse.json(
        {
          error:
            'لا يمكن حذف اختبار تم اعتماد نتائجه',
        },
        { status: 403 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('weekly_exams')
      .delete()
      .eq('id', examId)
      .eq('results_approved', false)
      .select('id')
      .maybeSingle()

    if (error) {
      return NextResponse.json(
        { error: 'تعذر حذف الاختبار' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        {
          error:
            'تعذر حذف الاختبار؛ ربما تم اعتماد نتائجه',
        },
        { status: 409 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch {
    return NextResponse.json(
      {
        error: 'حدث خطأ أثناء حذف الاختبار',
      },
      { status: 500 }
    )
  }
}


export async function PUT(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: 'غير مصرح بالدخول' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const examId = Number(body.examId)

    if (!Number.isInteger(examId) || examId <= 0) {
      return NextResponse.json(
        { error: 'رقم الاختبار غير صالح' },
        { status: 400 }
      )
    }

    const { data: exam, error: examError } =
      await supabaseAdmin
        .from('weekly_exams')
        .select('id, deadline_at, results_approved')
        .eq('id', examId)
        .maybeSingle()

    if (examError) {
      console.error('Approval exam lookup:', examError)
      return NextResponse.json(
        { error: 'تعذر قراءة بيانات الاختبار' },
        { status: 500 }
      )
    }

    if (!exam) {
      return NextResponse.json(
        { error: 'الاختبار غير موجود' },
        { status: 404 }
      )
    }

    if (exam.results_approved) {
      return NextResponse.json(
        { error: 'تم اعتماد النتائج مسبقاً' },
        { status: 409 }
      )
    }

    const now = new Date()
    const iraqDay = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Baghdad',
      weekday: 'long',
    }).format(now)

    if (iraqDay !== 'Friday') {
      return NextResponse.json(
        { error: 'اعتماد النتائج متاح يوم الجمعة فقط' },
        { status: 403 }
      )
    }

    if (
      !exam.deadline_at ||
      new Date(exam.deadline_at).getTime() > now.getTime()
    ) {
      return NextResponse.json(
        { error: 'لم ينتهِ موعد الاختبار بعد' },
        { status: 403 }
      )
    }

    const { data: pending, error: pendingError } =
      await supabaseAdmin
        .from('weekly_exam_submissions')
        .select('id')
        .eq('exam_id', examId)
        .eq('status', 'submitted')
        .limit(1)

    if (pendingError) {
      console.error('Approval pending check:', pendingError)
      return NextResponse.json(
        { error: 'تعذر التحقق من تصحيح التسليمات' },
        { status: 500 }
      )
    }

    if (pending?.length) {
      return NextResponse.json(
        { error: 'يوجد اختبارات لم يتم تصحيحها بعد' },
        { status: 409 }
      )
    }

    const { data: approvalResult, error: rpcError } =
      await supabaseAdmin.rpc(
        'approve_and_issue_weekly_exam',
        { p_exam_id: examId }
      )

    if (rpcError) {
      console.error('Certificate approval RPC failed:', {
        code: rpcError.code,
        message: rpcError.message,
        details: rpcError.details,
        hint: rpcError.hint,
      })

      return NextResponse.json(
        {
          error: 'فشل اعتماد النتائج داخل قاعدة البيانات',
          code: rpcError.code ?? null,
          details: rpcError.message,
        },
        { status: 500 }
      )
    }

    const result = Array.isArray(approvalResult)
      ? approvalResult[0]
      : approvalResult

    if (!result?.approved) {
      console.error(
        'Certificate approval returned no approval:',
        approvalResult
      )

      return NextResponse.json(
        {
          error: 'لم تؤكد قاعدة البيانات اعتماد النتائج',
        },
        { status: 409 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'تم اعتماد النتائج وإصدار الشهادات بنجاح',
      exam: {
        id: examId,
        results_approved: true,
        results_approved_at: now.toISOString(),
      },
      certificatesIssued:
        Number(result.certificates_issued ?? 0),
    })
  } catch (error) {
    console.error('Unexpected weekly approval error:', error)

    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع أثناء اعتماد النتائج' },
      { status: 500 }
    )
  }
}
