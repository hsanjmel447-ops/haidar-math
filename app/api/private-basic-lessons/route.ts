import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'

function getSecret() {
  return process.env.PRIVATE_SESSION_SECRET || ''
}

function getCookieValue(cookieHeader: string, name: string) {
  const cookies = cookieHeader.split(';')

  for (const cookie of cookies) {
    const [key, ...valueParts] = cookie.trim().split('=')

    if (key === name) {
      return decodeURIComponent(valueParts.join('='))
    }
  }

  return null
}

function verifyStudentSession(session: string | null) {
  try {
    if (!session) return null

    const parts = session.split('.')
    if (parts.length !== 3) return null

    const [studentIdText, expiresAt, signature] = parts

    const studentId = Number(studentIdText)
    const expires = Number(expiresAt)

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return null
    }

    if (!Number.isFinite(expires) || Date.now() > expires) {
      return null
    }

    const secret = getSecret()
    if (!secret) return null

    const expectedSignature = createHmac('sha256', secret)
      .update(`${studentIdText}.${expiresAt}`)
      .digest('hex')

    const receivedBuffer = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expectedSignature)

    if (receivedBuffer.length !== expectedBuffer.length) {
      return null
    }

    if (!timingSafeEqual(receivedBuffer, expectedBuffer)) {
      return null
    }

    return studentId
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const cookieHeader = request.headers.get('cookie') || ''

  const session = getCookieValue(
    cookieHeader,
    'private_student_session'
  )

  const studentId = verifyStudentSession(session)

  if (!studentId) {
    return NextResponse.json(
      { error: 'يجب تسجيل الدخول أولاً' },
      { status: 401 }
    )
  }

  const deviceId = request.headers.get('x-device-id')?.trim()

  if (!deviceId) {
    return NextResponse.json(
      { error: 'تعذر التحقق من الجهاز' },
      { status: 401 }
    )
  }

  const { data: student, error: studentError } =
    await supabaseAdmin
      .from('private_students')
      .select('id, device_id, is_active')
      .eq('id', studentId)
      .single()

  if (studentError || !student) {
    return NextResponse.json(
      { error: 'تعذر التحقق من حساب الطالب' },
      { status: 401 }
    )
  }

  if (!student.is_active) {
    return NextResponse.json(
      { error: 'حساب الطالب غير فعال' },
      { status: 403 }
    )
  }

  if (!student.device_id || student.device_id !== deviceId) {
    return NextResponse.json(
      { error: 'هذا الحساب مرتبط بجهاز آخر' },
      { status: 403 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('basic_lessons')
    .select(
      'id, topic, lecture_title, video_url, topic_order, lecture_order'
    )
    .eq('is_active', true)
    .order('topic_order', { ascending: true })
    .order('lecture_order', { ascending: true })
    .order('id', { ascending: true })

  if (error) {
    return NextResponse.json(
      { error: 'تعذر جلب محاضرات الأساسيات' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    lessons: data || [],
  })
}