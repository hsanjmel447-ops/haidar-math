import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''

  const match = cookieHeader.match(
    /(?:^|;\s*)private_student_session=([^;]+)/
  )

  if (!match) {
    return NextResponse.json(
      { error: 'يجب تسجيل الدخول أولاً' },
      { status: 401 }
    )
  }

  const token = decodeURIComponent(match[1])
  const [studentId, expiresAt, signature] = token.split('.')

  if (!studentId || !expiresAt || !signature) {
    return NextResponse.json(
      { error: 'الجلسة غير صالحة' },
      { status: 401 }
    )
  }

  const expires = Number(expiresAt)

  if (!Number.isFinite(expires) || Date.now() > expires) {
    return NextResponse.json(
      { error: 'انتهت جلسة الدخول' },
      { status: 401 }
    )
  }

  const secret = process.env.PRIVATE_SESSION_SECRET

  if (!secret) {
    return NextResponse.json(
      { error: 'خطأ في إعدادات الخادم' },
      { status: 500 }
    )
  }

  const expectedSignature = createHmac('sha256', secret)
    .update(`${studentId}.${expiresAt}`)
    .digest('hex')

  try {
    const signatureBuffer = Buffer.from(signature, 'hex')
    const expectedBuffer = Buffer.from(
      expectedSignature,
      'hex'
    )

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return NextResponse.json(
        { error: 'الجلسة غير صالحة' },
        { status: 401 }
      )
    }
  } catch {
    return NextResponse.json(
      { error: 'الجلسة غير صالحة' },
      { status: 401 }
    )
  }

  // التحقق من الجهاز
  const deviceId = request.headers.get('x-device-id')

  if (!deviceId) {
    return NextResponse.json(
      { error: 'تعذر التحقق من الجهاز' },
      { status: 401 }
    )
  }

  // التحقق من الطالب والاشتراك والجهاز
  const { data: student, error: studentError } =
    await supabaseAdmin
      .from('private_students')
      .select(
        'id, name, is_active, expires_at, device_id'
      )
      .eq('id', Number(studentId))
      .maybeSingle()

  if (studentError || !student) {
    return NextResponse.json(
      { error: 'الطالب غير موجود' },
      { status: 401 }
    )
  }

  if (!student.is_active) {
    return NextResponse.json(
      { error: 'الاشتراك متوقف' },
      { status: 403 }
    )
  }

  if (
    student.expires_at &&
    new Date(student.expires_at).getTime() <= Date.now()
  ) {
    return NextResponse.json(
      { error: 'انتهى الاشتراك' },
      { status: 403 }
    )
  }

  if (
    !student.device_id ||
    student.device_id !== deviceId
  ) {
    return NextResponse.json(
      {
        error:
          'هذه الجلسة غير مرتبطة بالجهاز المعتمد',
      },
      { status: 403 }
    )
  }

  // جلب المحاضرات المفعلة فقط
  const { data: lectures, error: lecturesError } =
    await supabaseAdmin
      .from('private_lectures')
      .select(
        'id, title, chapter, topic, video_url, sort_order'
      )
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

  if (lecturesError) {
    console.error(lecturesError)

    return NextResponse.json(
      { error: '