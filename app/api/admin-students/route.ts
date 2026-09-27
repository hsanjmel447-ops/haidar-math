import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function isAdminAuthenticated() {
  const secret = process.env.PRIVATE_SESSION_SECRET

  if (!secret) {
    throw new Error('PRIVATE_SESSION_SECRET is missing')
  }

  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value

  if (!token) {
    return false
  }

  const parts = token.split('.')

  if (parts.length !== 3) {
    return false
  }

  const [role, expiresAtText, receivedSignature] = parts

  if (role !== 'admin') {
    return false
  }

  const expiresAt = Number(expiresAtText)

  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return false
  }

  const payload = `${role}.${expiresAt}`

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
    return false
  }

  return timingSafeEqual(
    receivedBuffer,
    expectedBuffer
  )
}

// جلب الطلاب
export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        {
          success: false,
          message: 'غير مصرح لك',
        },
        { status: 401 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('private_students')
      .select(
        'id, name, access_code, is_active, expires_at, created_at, device_id'
      )
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.error(
        'ADMIN STUDENTS GET ERROR:',
        error
      )

      return NextResponse.json(
        {
          success: false,
          message: 'تعذر جلب الطلاب',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      students: data ?? [],
    })
  } catch (error) {
    console.error(
      'ADMIN STUDENTS GET ERROR:',
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

// إضافة طالب
export async function POST(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        {
          success: false,
          message: 'غير مصرح لك',
        },
        { status: 401 }
      )
    }

    const body = await request.json()

    const name = String(body.name ?? '').trim()

    const accessCode = String(
      body.accessCode ?? ''
    ).trim()

    const expiresAt = body.expiresAt
      ? String(body.expiresAt)
      : null

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: 'أدخل اسم الطالب',
        },
        { status: 400 }
      )
    }

    if (!accessCode) {
      return NextResponse.json(
        {
          success: false,
          message: 'أدخل كود الطالب',
        },
        { status: 400 }
      )
    }

    if (accessCode.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message:
            'كود الطالب يجب أن يكون 6 خانات على الأقل',
        },
        { status: 400 }
      )
    }

    // التأكد من أن الكود غير مستخدم
    const { data: existingStudent } =
      await supabaseAdmin
        .from('private_students')
        .select('id')
        .eq('access_code', accessCode)
        .maybeSingle()

    if (existingStudent) {
      return NextResponse.json(
        {
          success: false,
          message: 'هذا الكود مستخدم لطالب آخر',
        },
        { status: 409 }
      )
    }

    let normalizedExpiresAt: string | null = null

    if (expiresAt) {
      const parsedDate = new Date(expiresAt)

      if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message: 'تاريخ انتهاء الاشتراك غير صحيح',
          },
          { status: 400 }
        )
      }

      normalizedExpiresAt =
        parsedDate.toISOString()
    }

    const { data: student, error } =
      await supabaseAdmin
        .from('private_students')
        .insert({
          name,
          access_code: accessCode,
          is_active: true,
          expires_at: normalizedExpiresAt,
        })
        .select(
          'id, name, access_code, is_active, expires_at, created_at, device_id'
        )
        .single()

    if (error) {
      console.error(
        'ADMIN STUDENTS CREATE ERROR:',
        error
      )

      return NextResponse.json(
        {
          success: false,
          message: 'تعذر إضافة الطالب',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        student,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error(
      'ADMIN STUDENTS CREATE ERROR:',
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

// إيقاف / تفعيل الطالب
// إعادة تعيين الجهاز
// أو تعديل بيانات الطالب
export async function PATCH(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        {
          success: false,
          message: 'غير مصرح لك',
        },
        { status: 401 }
      )
    }

    const body = await request.json()

    const studentId = Number(body.studentId)

    if (
      !Number.isInteger(studentId) ||
      studentId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'رقم الطالب غير صحيح',
        },
        { status: 400 }
      )
    }

    // =========================
    // إعادة تعيين جهاز الطالب
    // =========================

    if (body.resetDevice === true) {
      const { data: student, error } =
        await supabaseAdmin
          .from('private_students')
          .update({
            device_id: null,
          })
          .eq('id', studentId)
          .select(
            'id, name, access_code, is_active, expires_at, created_at, device_id'
          )
          .maybeSingle()

      if (error) {
        console.error(
          'ADMIN STUDENT DEVICE RESET ERROR:',
          error
        )

        return NextResponse.json(
          {
            success: false,
            message: 'تعذر إعادة تعيين الجهاز',
          },
          { status: 500 }
        )
      }

      if (!student) {
        return NextResponse.json(
          {
            success: false,
            message: 'الطالب غير موجود',
          },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        student,
        message:
          'تمت إعادة تعيين جهاز الطالب بنجاح',
      })
    }

    // =========================
    // إيقاف أو تفعيل الطالب
    // =========================

    if (typeof body.isActive === 'boolean') {
      const { data: student, error } =
        await supabaseAdmin
          .from('private_students')
          .update({
            is_active: body.isActive,
          })
          .eq('id', studentId)
          .select(
            'id, name, access_code, is_active, expires_at, created_at, device_id'
          )
          .maybeSingle()

      if (error) {
        console.error(
          'ADMIN STUDENTS STATUS UPDATE ERROR:',
          error
        )

        return NextResponse.json(
          {
            success: false,
            message: 'تعذر تحديث حالة الطالب',
          },
          { status: 500 }
        )
      }

      if (!student) {
        return NextResponse.json(
          {
            success: false,
            message: 'الطالب غير موجود',
          },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        student,
        message: body.isActive
          ? 'تم تفعيل الطالب'
          : 'تم إيقاف الطالب',
      })
    }

    // =========================
    // تعديل بيانات الطالب
    // =========================

    const name = String(body.name ?? '').trim()

    const accessCode = String(
      body.accessCode ?? ''
    ).trim()

    const expiresAt = body.expiresAt
      ? String(body.expiresAt)
      : null

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: 'أدخل اسم الطالب',
        },
        { status: 400 }
      )
    }

    if (!accessCode) {
      return NextResponse.json(
        {
          success: false,
          message: 'أدخل كود الطالب',
        },
        { status: 400 }
      )
    }

    if (accessCode.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message:
            'كود الطالب يجب أن يكون 6 خانات على الأقل',
        },
        { status: 400 }
      )
    }

    // التأكد من أن الكود ليس لطالب آخر
    const { data: existingStudent } =
      await supabaseAdmin
        .from('private_students')
        .select('id')
        .eq('access_code', accessCode)
        .neq('id', studentId)
        .maybeSingle()

    if (existingStudent) {
      return NextResponse.json(
        {
          success: false,
          message: 'هذا الكود مستخدم لطالب آخر',
        },
        { status: 409 }
      )
    }

    let normalizedExpiresAt: string | null = null

    if (expiresAt) {
      const parsedDate = new Date(expiresAt)

      if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message:
              'تاريخ انتهاء الاشتراك غير صحيح',
          },
          { status: 400 }
        )
      }

      normalizedExpiresAt =
        parsedDate.toISOString()
    }

    const { data: student, error } =
      await supabaseAdmin
        .from('private_students')
        .update({
          name,
          access_code: accessCode,
          expires_at: normalizedExpiresAt,
        })
        .eq('id', studentId)
        .select(
          'id, name, access_code, is_active, expires_at, created_at, device_id'
        )
        .maybeSingle()

    if (error) {
      console.error(
        'ADMIN STUDENTS EDIT ERROR:',
        error
      )

      return NextResponse.json(
        {
          success: false,
          message: 'تعذر تعديل بيانات الطالب',
        },
        { status: 500 }
      )
    }

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message: 'الطالب غير موجود',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      student,
      message:
        'تم تعديل بيانات الطالب بنجاح',
    })
  } catch (error) {
    console.error(
      'ADMIN STUDENTS UPDATE ERROR:',
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