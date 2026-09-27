import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'

function isAdmin(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''

  const match = cookieHeader.match(
    /(?:^|;\s*)admin_session=([^;]+)/
  )

  if (!match) {
    return false
  }

  const token = decodeURIComponent(match[1])

  const [role, expiresAt, signature] = token.split('.')

  if (
    role !== 'admin' ||
    !expiresAt ||
    !signature
  ) {
    return false
  }

  const expires = Number(expiresAt)

  if (!Number.isFinite(expires) || Date.now() > expires) {
    return false
  }

  const secret = process.env.PRIVATE_SESSION_SECRET

  if (!secret) {
    return false
  }

  const payload = `admin.${expiresAt}`

  const expectedSignature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  try {
    const signatureBuffer = Buffer.from(signature, 'hex')
    const expectedBuffer = Buffer.from(
      expectedSignature,
      'hex'
    )

    if (
      signatureBuffer.length !== expectedBuffer.length
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

// جلب جميع المحاضرات
export async function GET(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: 'غير مصرح بالدخول' },
      { status: 401 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('private_lectures')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('LOAD LECTURES ERROR:', error)

    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحميل المحاضرات' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    lectures: data ?? [],
  })
}

// إضافة محاضرة جديدة
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
    const chapter = String(body.chapter ?? '').trim()
    const topic = String(body.topic ?? '').trim()
    const videoUrl = String(body.videoUrl ?? '').trim()
    const sortOrder = Number(body.sortOrder ?? 0)

    if (!title) {
      return NextResponse.json(
        { error: 'أدخل اسم الدرس' },
        { status: 400 }
      )
    }

    if (!chapter) {
      return NextResponse.json(
        { error: 'أدخل الفصل' },
        { status: 400 }
      )
    }

    if (!topic) {
      return NextResponse.json(
        { error: 'أدخل الموضوع' },
        { status: 400 }
      )
    }

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'أدخل رابط المحاضرة' },
        { status: 400 }
      )
    }

    try {
      const url = new URL(videoUrl)

      if (
        url.protocol !== 'https:' &&
        url.protocol !== 'http:'
      ) {
        throw new Error('Invalid URL')
      }
    } catch {
      return NextResponse.json(
        { error: 'رابط المحاضرة غير صحيح' },
        { status: 400 }
      )
    }

    if (!Number.isFinite(sortOrder)) {
      return NextResponse.json(
        { error: 'ترتيب المحاضرة غير صحيح' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('private_lectures')
      .insert({
        title,
        chapter,
        topic,
        video_url: videoUrl,
        sort_order: sortOrder,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('ADD LECTURE ERROR:', error)

      return NextResponse.json(
        { error: 'حدث خطأ أثناء إضافة المحاضرة' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'تمت إضافة المحاضرة بنجاح',
      lecture: data,
    })
  } catch {
    return NextResponse.json(
      { error: 'البيانات المرسلة غير صحيحة' },
      { status: 400 }
    )
  }
}

// تعديل المحاضرة أو إظهارها وإخفائها
export async function PATCH(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: 'غير مصرح بالدخول' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const lectureId = Number(body.lectureId)

    if (!Number.isFinite(lectureId)) {
      return NextResponse.json(
        { error: 'رقم المحاضرة غير صحيح' },
        { status: 400 }
      )
    }

    // إظهار أو إخفاء المحاضرة
    if (typeof body.isActive === 'boolean') {
      const { data, error } = await supabaseAdmin
        .from('private_lectures')
        .update({
          is_active: body.isActive,
        })
        .eq('id', lectureId)
        .select()
        .single()

      if (error) {
        console.error(
          'TOGGLE LECTURE ERROR:',
          error
        )

        return NextResponse.json(
          {
            error:
              'حدث خطأ أثناء تحديث حالة المحاضرة',
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        lecture: data,
      })
    }

    // تعديل بيانات المحاضرة
    const title = String(body.title ?? '').trim()
    const chapter = String(body.chapter ?? '').trim()
    const topic = String(body.topic ?? '').trim()
    const videoUrl = String(body.videoUrl ?? '').trim()
    const sortOrder = Number(body.sortOrder ?? 0)

    if (!title || !chapter || !topic || !videoUrl) {
      return NextResponse.json(
        {
          error:
            'يرجى إدخال الفصل والموضوع واسم الدرس ورابط المحاضرة',
        },
        { status: 400 }
      )
    }

    try {
      const url = new URL(videoUrl)

      if (
        url.protocol !== 'https:' &&
        url.protocol !== 'http:'
      ) {
        throw new Error('Invalid URL')
      }
    } catch {
      return NextResponse.json(
        { error: 'رابط المحاضرة غير صحيح' },
        { status: 400 }
      )
    }

    if (!Number.isFinite(sortOrder)) {
      return NextResponse.json(
        { error: 'ترتيب المحاضرة غير صحيح' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('private_lectures')
      .update({
        title,
        chapter,
        topic,
        video_url: videoUrl,
        sort_order: sortOrder,
      })
      .eq('id', lectureId)
      .select()
      .single()

    if (error) {
      console.error('EDIT LECTURE ERROR:', error)

      return NextResponse.json(
        { error: 'حدث خطأ أثناء تعديل المحاضرة' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'تم تعديل المحاضرة بنجاح',
      lecture: data,
    })
  } catch {
    return NextResponse.json(
      { error: 'البيانات المرسلة غير صحيحة' },
      { status: 400 }
    )
  }
}