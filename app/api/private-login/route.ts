import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  try {
    const { code } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, message: 'أدخل كود الاشتراك' },
        { status: 400 }
      )
    }

    const { data: student, error } = await supabaseAdmin
      .from('private_students')
      .select('id, name, is_active, expires_at')
      .eq('access_code', code.trim())
      .maybeSingle()

    if (error) {
      console.error('SUPABASE LOGIN ERROR:', JSON.stringify(error))

      return NextResponse.json(
        { success: false, message: 'حدث خطأ أثناء تسجيل الدخول' },
        { status: 500 }
      )
    }

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'كود الاشتراك غير صحيح' },
        { status: 401 }
      )
    }

    if (!student.is_active) {
      return NextResponse.json(
        { success: false, message: 'هذا الاشتراك غير فعال' },
        { status: 403 }
      )
    }

    if (
      student.expires_at &&
      new Date(student.expires_at).getTime() < Date.now()
    ) {
      return NextResponse.json(
        { success: false, message: 'انتهت مدة الاشتراك' },
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
  } catch {
    return NextResponse.json(
      { success: false, message: 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}