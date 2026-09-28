import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'

function getSecret() {
  return process.env.PRIVATE_SESSION_SECRET || ''
}

async function isAdminAuthenticated() {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get('admin_session')?.value

    if (!session) return false

    const parts = session.split('.')
    if (parts.length !== 3) return false

    const [role, expiresAt, signature] = parts

    if (role !== 'admin') return false

    const expires = Number(expiresAt)

    if (!Number.isFinite(expires)) return false
    if (Date.now() > expires) return false

    const secret = getSecret()
    if (!secret) return false

    const expectedSignature = createHmac('sha256', secret)
      .update(`${role}.${expiresAt}`)
      .digest('hex')

    const receivedBuffer = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expectedSignature)

    if (receivedBuffer.length !== expectedBuffer.length) {
      return false
    }

    return timingSafeEqual(receivedBuffer, expectedBuffer)
  } catch {
    return false
  }
}

// جلب جميع محاضرات الأساسيات
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      { error: 'غير مصرح' },
      { status: 401 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('basic_lessons')
    .select('*')
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

// إضافة محاضرة جديدة
export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      { error: 'غير مصرح' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()

    const topic = String(body.topic || '').trim()
    const lectureTitle = String(body.lectureTitle || '').trim()
    const videoUrl = String(body.videoUrl || '').trim()

    const topicOrder = Number(body.topicOrder ?? 0)
    const lectureOrder = Number(body.lectureOrder ?? 0)

    if (!topic || !lectureTitle || !videoUrl) {
      return NextResponse.json(
        {
          error:
            'اسم الموضوع وعنوان المحاضرة ورابط الفيديو مطلوبة',
        },
        { status: 400 }
      )
    }

    if (
      !Number.isInteger(topicOrder) ||
      topicOrder < 0 ||
      !Number.isInteger(lectureOrder) ||
      lectureOrder < 0
    ) {
      return NextResponse.json(
        { error: 'قيم الترتيب غير صحيحة' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('basic_lessons')
      .insert({
        topic,
        lecture_title: lectureTitle,
        video_url: videoUrl,
        topic_order: topicOrder,
        lecture_order: lectureOrder,
        is_active: body.isActive ?? true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'تعذر إضافة المحاضرة' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      lesson: data,
      message: 'تمت إضافة المحاضرة بنجاح',
    })
  } catch {
    return NextResponse.json(
      { error: 'البيانات المرسلة غير صحيحة' },
      { status: 400 }
    )
  }
}

// تعديل المحاضرة أو إظهارها وإخفاؤها
export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      { error: 'غير مصرح' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const id = Number(body.id)

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: 'معرف المحاضرة غير صحيح' },
        { status: 400 }
      )
    }

    const updates: Record<string, unknown> = {}

    if (body.topic !== undefined) {
      const topic = String(body.topic).trim()

      if (!topic) {
        return NextResponse.json(
          { error: 'اسم الموضوع مطلوب' },
          { status: 400 }
        )
      }

      updates.topic = topic
    }

    if (body.lectureTitle !== undefined) {
      const lectureTitle = String(body.lectureTitle).trim()

      if (!lectureTitle) {
        return NextResponse.json(
          { error: 'عنوان المحاضرة مطلوب' },
          { status: 400 }
        )
      }

      updates.lecture_title = lectureTitle
    }

    if (body.videoUrl !== undefined) {
      const videoUrl = String(body.videoUrl).trim()

      if (!videoUrl) {
        return NextResponse.json(
          { error: 'رابط الفيديو مطلوب' },
          { status: 400 }
        )
      }

      updates.video_url = videoUrl
    }

    if (body.topicOrder !== undefined) {
      const topicOrder = Number(body.topicOrder)

      if (!Number.isInteger(topicOrder) || topicOrder < 0) {
        return NextResponse.json(
          { error: 'ترتيب الموضوع غير صحيح' },
          { status: 400 }
        )
      }

      updates.topic_order = topicOrder
    }

    if (body.lectureOrder !== undefined) {
      const lectureOrder = Number(body.lectureOrder)

      if (!Number.isInteger(lectureOrder) || lectureOrder < 0) {
        return NextResponse.json(
          { error: 'ترتيب المحاضرة غير صحيح' },
          { status: 400 }
        )
      }

      updates.lecture_order = lectureOrder
    }

    if (body.isActive !== undefined) {
      updates.is_active = Boolean(body.isActive)
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'لا توجد بيانات للتعديل' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('basic_lessons')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'تعذر تعديل المحاضرة' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      lesson: data,
      message: 'تم تعديل المحاضرة بنجاح',
    })
  } catch {
    return NextResponse.json(
      { error: 'البيانات المرسلة غير صحيحة' },
      { status: 400 }
    )
  }
}

// حذف المحاضرة
export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      { error: 'غير مصرح' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const id = Number(body.id)

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: 'معرف المحاضرة غير صحيح' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('basic_lessons')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: 'تعذر حذف المحاضرة' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف المحاضرة بنجاح',
    })
  } catch {
    return NextResponse.json(
      { error: 'تعذر حذف المحاضرة' },
      { status: 400 }
    )
  }
}