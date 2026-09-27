import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'

function createSessionToken(studentId: number) {
  const secret = process.env.PRIVATE_SESSION_SECRET

  if (!secret) {
    throw new Error('PRIVATE_SESSION_SECRET is missing')
  }

  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000
  const payload = `${studentId}.${expiresAt}`

  const signature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return {
    token: `${payload}.${signature}`,
    expiresAt,
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const code = String(body.code ?? '').trim()
    const deviceId = String(body.deviceId ?? '').trim()

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          message: 'أدخل كود الاشتراك',
        },
        { status: 400 }
      )
    }

    if (!deviceId) {
      return NextResponse.json(
        {
          success: false,
          message: 'تعذر التحقق من الجهاز',
        },
        { status: 400 }
      )
    }

    const { data: student, error } = await supabaseAdmin
      .from('private_students')
      .select(
        'id, name, is_active, expires_at, device_id'
      )
      .eq('access_code', code)
      .maybeSingle()

    if (error) {
      console.error('SUPABASE LOGIN ERROR:', error)

      return NextResponse.json(
        {
          success: false,
          message: 'حدث خطأ في الاتصال بقاعدة البيانات',
        },
        { status: 500 }
      )
    }

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message: 'كود الاشتراك غير صحيح',
        },
        { status: 401 }
      )
    }

    if (!student.is_active) {
      return NextResponse.json(
        {
          success: false,
          message: 'هذا الاشتراك غير فعال',
        },
        { status: 403 }
      )
    }

    if (
      student.expires_at &&
      new Date(student.expires_at).getTime() < Date.now()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'انتهت مدة الاشتراك',
        },
        { status: 403 }
      )
    }

    // إذا لم يكن هناك جهاز مرتبط:
    // هذا الجهاز يصبح الجهاز المعتمد للطالب
    if (!student.device_id) {
      const { error: deviceUpdateError } =
        await supabaseAdmin
          .from('private_students')
          .update({
            device_id: deviceId,
          })
          .eq('id', student.id)
          .is('device_id', null)

      if (deviceUpdateError) {
        console.error(
          'DEVICE BIND ERROR:',
          deviceUpdateError
        )

        return NextResponse.json(
          {
            success: false,
            message: 'تعذر ربط الجهاز بالحساب',
          },
          { status: 500 }
        )
      }

      // نقرأ الطالب مرة ثانية للتأكد من الجهاز المرتبط فعلياً
      const { data: updatedStudent, error: recheckError } =
        await supabaseAdmin
          .from('private_students')
          .select('device_id')
          .eq('id', student.id)
          .single()

      if (recheckError || !updatedStudent) {
        return NextResponse.json(
          {
            success: false,
            message: 'تعذر التحقق من الجهاز',
          },
          { status: 500 }
        )
      }

      if (updatedStudent.device_id !== deviceId) {
        return NextResponse.json(
          {
            success: false,
            message:
              'هذا الكود مرتبط بجهاز آخر. تواصل مع الأستاذ لإعادة تعيين الجهاز.',
          },
          { status: 403 }
        )
      }
    } else if (student.device_id !== deviceId) {
      // الكود مرتبط مسبقاً بجهاز مختلف
      return NextResponse.json(
        {
          success: false,
          message:
            'هذا الكود مرتبط بجهاز آخر. تواصل مع الأستاذ لإعادة تعيين الجهاز.',
        },
        { status: 403 }
      )
    }

    const session = createSessionToken(student.id)

    const response = NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
      },
    })

    response.cookies.set({
      name: 'private_student_session',
      value: session.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(session.expiresAt),
    })

    return response
  } catch (error) {
    console.error('PRIVATE LOGIN ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'حدث خطأ غير متوقع',
      },
      { status: 500 }
    )
  }
}