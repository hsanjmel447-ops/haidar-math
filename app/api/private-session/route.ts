import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'

function verifySessionToken(token: string) {
  const secret = process.env.PRIVATE_SESSION_SECRET

  if (!secret) {
    throw new Error('PRIVATE_SESSION_SECRET is missing')
  }

  const parts = token.split('.')

  if (parts.length !== 3) {
    return null
  }

  const [studentIdText, expiresAtText, receivedSignature] = parts

  const studentId = Number(studentIdText)
  const expiresAt = Number(expiresAtText)

  if (
    !Number.isInteger(studentId) ||
    studentId <= 0 ||
    !Number.isFinite(expiresAt) ||
    expiresAt <= Date.now()
  ) {
    return null
  }

  const payload = `${studentId}.${expiresAt}`

  const expectedSignature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  const receivedBuffer = Buffer.from(
    receivedSignature,
    'utf8'
  )

  const expectedBuffer = Buffer.from(
    expectedSignature,
    'utf8'
  )

  if (receivedBuffer.length !== expectedBuffer.length) {
    return null
  }

  if (!timingSafeEqual(receivedBuffer, expectedBuffer)) {
    return null
  }

  return {
    studentId,
    expiresAt,
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()

    const token = cookieStore.get(
      'private_student_session'
    )?.value

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'لا توجد جلسة دخول',
        },
        { status: 401 }
      )
    }

    const session = verifySessionToken(token)

    if (!session) {
      const response = NextResponse.json(
        {
          success: false,
          message: 'جلسة الدخول غير صالحة',
        },
        { status: 401 }
      )

      response.cookies.delete(
        'private_student_session'
      )

      return response
    }

    const deviceId = request.headers
      .get('x-device-id')
      ?.trim()

    if (!deviceId) {
      const response = NextResponse.json(
        {
          success: false,
          message: 'تعذر التحقق من الجهاز',
        },
        { status: 401 }
      )

      response.cookies.delete(
        'private_student_session'
      )

      return response
    }

    const { data: student, error } =
      await supabaseAdmin
        .from('private_students')
        .select(
          'id, name, is_active, expires_at, device_id'
        )
        .eq('id', session.studentId)
        .maybeSingle()

    if (error) {
      console.error(
        'PRIVATE SESSION ERROR:',
        error
      )

      return NextResponse.json(
        {
          success: false,
          message:
            'حدث خطأ في الاتصال بقاعدة البيانات',
        },
        { status: 500 }
      )
    }

    if (!student || !student.is_active) {
      const response = NextResponse.json(
        {
          success: false,
          message: 'الاشتراك غير فعال',
        },
        { status: 401 }
      )

      response.cookies.delete(
        'private_student_session'
      )

      return response
    }

    if (
      student.expires_at &&
      new Date(student.expires_at).getTime() <
        Date.now()
    ) {
      const response = NextResponse.json(
        {
          success: false,
          message: 'انتهت مدة الاشتراك',
        },
        { status: 403 }
      )

      response.cookies.delete(
        'private_student_session'
      )

      return response
    }

    if (
      !student.device_id ||
      student.device_id !== deviceId
    ) {
      const response = NextResponse.json(
        {
          success: false,
          message:
            'هذه الجلسة غير مرتبطة بالجهاز المعتمد',
        },
        { status: 403 }
      )

      response.cookies.delete(
        'private_student_session'
      )

      return response
    }

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
      },
    })
  } catch (error) {
    console.error(
      'PRIVATE SESSION ERROR:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        message: 'حدث خطأ غير متوقع',
      },
      { status: 500 }
    )
  }
}