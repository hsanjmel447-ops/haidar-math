import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const code = String(body.code ?? '').trim()

    if (!code) {
      return NextResponse.json(
        { success: false, message: 'أدخل كود الاشتراك' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('private_students')
      .select('id, name, access_code, is_active, expires_at')

    if (error) {
      console.error('SUPABASE ERROR:', error)

      return NextResponse.json(
        {
          success: false,
          message: 'حدث خطأ في الاتصال بقاعدة البيانات',
        },
        { status: 500 }
      )
    }

    const student = data?.find(
      (item) => String(item.access_code).trim() === code
    )

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

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
      },
    })
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