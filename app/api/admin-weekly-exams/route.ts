import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'

function isAdmin(request: Request) {
  const cookieHeader =
    request.headers.get('cookie') ?? ''

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

  const secret =
    process.env.PRIVATE_SESSION_SECRET

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
        { error: 'تعذر تحميل الاختبارات الأسبوعية' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      exams: data ?? [],
    })
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحميل الاختبارات' },
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