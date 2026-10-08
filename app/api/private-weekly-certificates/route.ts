
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

function verifySessionToken(token: string) {
  const secret = process.env.PRIVATE_SESSION_SECRET

  if (!secret) {
    throw new Error('PRIVATE_SESSION_SECRET is missing')
  }

  const parts = token.split('.')

  if (parts.length !== 3) return null

  const [studentIdText, expiresAtText, signature] = parts

  const studentId = Number(studentIdText)
  const expiresAt = Number(expiresAtText)

  if (
    !Number.isSafeInteger(studentId) ||
    studentId <= 0 ||
    !Number.isFinite(expiresAt) ||
    expiresAt <= Date.now() ||
    !/^[a-f0-9]{64}$/i.test(signature)
  ) {
    return null
  }

  const expected = createHmac('sha256', secret)
    .update(`${studentId}.${expiresAt}`)
    .digest('hex')

  const receivedBuffer = Buffer.from(signature, 'hex')
  const expectedBuffer = Buffer.from(expected, 'hex')

  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(receivedBuffer, expectedBuffer)
  ) {
    return null
  }

  return { studentId }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()

    const token = cookieStore.get(
      'private_student_session'
    )?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'يرجى تسجيل الدخول' },
        { status: 401 }
      )
    }

    const session = verifySessionToken(token)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'جلسة الدخول غير صالحة' },
        { status: 401 }
      )
    }

    const deviceId = request.headers
      .get('x-device-id')
      ?.trim()

    if (!deviceId) {
      return NextResponse.json(
        { success: false, error: 'تعذر التحقق من الجهاز' },
        { status: 401 }
      )
    }

    const { data: student, error: studentError } =
      await supabaseAdmin
        .from('private_students')
        .select('id, is_active, expires_at, device_id')
        .eq('id', session.studentId)
        .maybeSingle()

    if (studentError) {
      return NextResponse.json(
        { success: false, error: 'تعذر التحقق من الاشتراك' },
        { status: 500 }
      )
    }

    if (!student || !student.is_active) {
      return NextResponse.json(
        { success: false, error: 'الاشتراك غير فعال' },
        { status: 403 }
      )
    }

    if (
      student.expires_at &&
      new Date(student.expires_at).getTime() < Date.now()
    ) {
      return NextResponse.json(
        { success: false, error: 'انتهت مدة الاشتراك' },
        { status: 403 }
      )
    }

    if (
      !student.device_id ||
      student.device_id !== deviceId
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'الجهاز غير معتمد لهذا الحساب',
        },
        { status: 403 }
      )
    }

    const { data: certificates, error } =
      await supabaseAdmin
        .from('private_weekly_certificates')
        .select(`
          id,
          certificate_code,
          certificate_type,
          student_name,
          exam_title,
          final_score,
          total_score,
          percentage,
          design_number,
          motivation_number,
          issued_at
        `)
        .eq('student_id', student.id)
        .is('revoked_at', null)
        .order('issued_at', { ascending: false })

    if (error) {
      console.error('CERTIFICATES ERROR:', error)

      return NextResponse.json(
        { success: false, error: 'تعذر تحميل الشهادات' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        certificates: certificates ?? [],
      },
      {
        headers: {
          'Cache-Control': 'private, no-store',
        },
      }
    )
  } catch (error) {
    console.error('CERTIFICATES API ERROR:', error)

    return NextResponse.json(
      { success: false, error: 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}
