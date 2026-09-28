import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'

function isAdminAuthenticated(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') || ''

  const adminCookie = cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('admin_session='))

  if (!adminCookie) {
    return false
  }

  const token = decodeURIComponent(
    adminCookie.substring('admin_session='.length)
  )

  const parts = token.split('.')

  if (parts.length !== 3) {
    return false
  }

  const [role, expiresAtString, signature] = parts

  if (role !== 'admin') {
    return false
  }

  const expiresAt = Number(expiresAtString)

  if (
    !Number.isFinite(expiresAt) ||
    Date.now() > expiresAt
  ) {
    return false
  }

  const secret = process.env.PRIVATE_SESSION_SECRET

  if (!secret) {
    return false
  }

  const expectedSignature = createHmac(
    'sha256',
    secret
  )
    .update(`${role}.${expiresAtString}`)
    .digest('hex')

  try {
    return timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  } catch {
    return false
  }
}

function cleanText(value: unknown) {
  return typeof value === 'string'
    ? value.trim()
    : ''
}

function cleanOrder(value: unknown) {
  const number = Number(value)

  if (!Number.isInteger(number) || number < 0) {
    return null
  }

  return number
}

export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { success: false, error: 'غير مصرح' },
      { status: 401 }
    )
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('ministerial_reviews')
      .select('*')
      .order('chapter_order', {
        ascending: true,
      })
      .order('topic_order', {
        ascending: true,
      })
      .order('lecture_order', {
        ascending: true,
      })
      .order('id', {
        ascending: true,
      })

    if (error) {
      console.error(
        'Ministerial reviews GET error:',
        error
      )

      return NextResponse.json(
        {
          success: false,
          error: 'تعذر تحميل المحاضرات',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      reviews: data ?? [],
    })
  } catch (error) {
    console.error(
      'Ministerial reviews GET exception:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        error: 'حدث خطأ في الخادم',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { success: false, error: 'غير مصرح' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()

    const chapter = cleanText(body.chapter)
    const topic = cleanText(body.topic)
    const lectureTitle = cleanText(
      body.lectureTitle
    )
    const videoUrl = cleanText(body.videoUrl)

    const chapterOrder = cleanOrder(
      body.chapterOrder ?? 0
    )

    const topicOrder = cleanOrder(
      body.topicOrder ?? 0
    )

    const lectureOrder = cleanOrder(
      body.lectureOrder ?? 0
    )

    if (
      !chapter ||
      !topic ||
      !lectureTitle ||
      !videoUrl
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'الفصل والموضوع واسم المحاضرة والرابط مطلوبة',
        },
        { status: 400 }
      )
    }

    if (
      chapterOrder === null ||
      topicOrder === null ||
      lectureOrder === null
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'قيم الترتيب غير صحيحة',
        },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('ministerial_reviews')
      .insert({
        chapter,
        topic,
        lecture_title: lectureTitle,
        video_url: videoUrl,
        chapter_order: chapterOrder,
        topic_order: topicOrder,
        lecture_order: lectureOrder,
        is_active:
          typeof body.isActive === 'boolean'
            ? body.isActive
            : true,
      })
      .select()
      .single()

    if (error) {
      console.error(
        'Ministerial review POST error:',
        error
      )

      return NextResponse.json(
        {
          success: false,
          error: 'تعذر إضافة المحاضرة',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      review: data,
    })
  } catch (error) {
    console.error(
      'Ministerial review POST exception:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        error: 'حدث خطأ في الخادم',
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest
) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { success: false, error: 'غير مصرح' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const id = Number(body.id)

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'رقم المحاضرة غير صحيح',
        },
        { status: 400 }
      )
    }

    const updates: Record<string, unknown> = {}

    if (body.chapter !== undefined) {
      const chapter = cleanText(body.chapter)

      if (!chapter) {
        return NextResponse.json(
          {
            success: false,
            error: 'اسم الفصل مطلوب',
          },
          { status: 400 }
        )
      }

      updates.chapter = chapter
    }

    if (body.topic !== undefined) {
      const topic = cleanText(body.topic)

      if (!topic) {
        return NextResponse.json(
          {
            success: false,
            error: 'اسم الموضوع مطلوب',
          },
          { status: 400 }
        )
      }

      updates.topic = topic
    }

    if (body.lectureTitle !== undefined) {
      const lectureTitle = cleanText(
        body.lectureTitle
      )

      if (!lectureTitle) {
        return NextResponse.json(
          {
            success: false,
            error: 'اسم المحاضرة مطلوب',
          },
          { status: 400 }
        )
      }

      updates.lecture_title = lectureTitle
    }

    if (body.videoUrl !== undefined) {
      const videoUrl = cleanText(body.videoUrl)

      if (!videoUrl) {
        return NextResponse.json(
          {
            success: false,
            error: 'رابط المحاضرة مطلوب',
          },
          { status: 400 }
        )
      }

      updates.video_url = videoUrl
    }

    if (body.chapterOrder !== undefined) {
      const value = cleanOrder(
        body.chapterOrder
      )

      if (value === null) {
        return NextResponse.json(
          {
            success: false,
            error: 'ترتيب الفصل غير صحيح',
          },
          { status: 400 }
        )
      }

      updates.chapter_order = value
    }

    if (body.topicOrder !== undefined) {
      const value = cleanOrder(
        body.topicOrder
      )

      if (value === null) {
        return NextResponse.json(
          {
            success: false,
            error: 'ترتيب الموضوع غير صحيح',
          },
          { status: 400 }
        )
      }

      updates.topic_order = value
    }

    if (body.lectureOrder !== undefined) {
      const value = cleanOrder(
        body.lectureOrder
      )

      if (value === null) {
        return NextResponse.json(
          {
            success: false,
            error: 'ترتيب المحاضرة غير صحيح',
          },
          { status: 400 }
        )
      }

      updates.lecture_order = value
    }

    if (body.isActive !== undefined) {
      if (typeof body.isActive !== 'boolean') {
        return NextResponse.json(
          {
            success: false,
            error: 'حالة المحاضرة غير صحيحة',
          },
          { status: 400 }
        )
      }

      updates.is_active = body.isActive
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'لا توجد تغييرات للحفظ',
        },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('ministerial_reviews')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error(
        'Ministerial review PATCH error:',
        error
      )

      return NextResponse.json(
        {
          success: false,
          error: 'تعذر تعديل المحاضرة',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      review: data,
    })
  } catch (error) {
    console.error(
      'Ministerial review PATCH exception:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        error: 'حدث خطأ في الخادم',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest
) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { success: false, error: 'غير مصرح' },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(
      request.url
    )

    const id = Number(
      searchParams.get('id')
    )

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'رقم المحاضرة غير صحيح',
        },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('ministerial_reviews')
      .delete()
      .eq('id', id)

    if (error) {
      console.error(
        'Ministerial review DELETE error:',
        error
      )

      return NextResponse.json(
        {
          success: false,
          error: 'تعذر حذف المحاضرة',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error(
      'Ministerial review DELETE exception:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        error: 'حدث خطأ في الخادم',
      },
      { status: 500 }
    )
  }
}