import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'

function isAdmin(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const match = cookieHeader.match(
    /(?:^|;\s*)admin_session=([^;]+)/
  )

  if (!match) return false

  const token = decodeURIComponent(match[1])
  const [admin, expiresAt, signature] = token.split('.')

  if (
    admin !== 'admin' ||
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

  if (!secret) return false

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

    if (signatureBuffer.length !== expectedBuffer.length) {
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

// جلب جميع الاختبارات
export async function GET(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: 'غير مصرح بالدخول' },
      { status: 401 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('private_quizzes')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('LOAD QUIZZES ERROR:', error)

    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحميل الاختبارات' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    quizzes: data ?? [],
  })
}

// إضافة اختبار جديد
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
    const description = String(
      body.description ?? ''
    ).trim()

    const sortOrder = Number(body.sortOrder ?? 0)
    const durationMinutes = Number(
      body.durationMinutes ?? 0
    )
    const passingScore = Number(
      body.passingScore ?? 50
    )
    const maxAttempts = Number(
      body.maxAttempts ?? 1
    )

    const showResult =
      typeof body.showResult === 'boolean'
        ? body.showResult
        : true

    if (!title) {
      return NextResponse.json(
        { error: 'أدخل اسم الاختبار' },
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

    if (
      !Number.isInteger(sortOrder) ||
      sortOrder < 0
    ) {
      return NextResponse.json(
        { error: 'ترتيب الاختبار غير صحيح' },
        { status: 400 }
      )
    }

    if (
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 0
    ) {
      return NextResponse.json(
        { error: 'مدة الاختبار غير صحيحة' },
        { status: 400 }
      )
    }

    if (
      !Number.isInteger(passingScore) ||
      passingScore < 0 ||
      passingScore > 100
    ) {
      return NextResponse.json(
        { error: 'درجة النجاح يجب أن تكون من 0 إلى 100' },
        { status: 400 }
      )
    }

    if (
      !Number.isInteger(maxAttempts) ||
      maxAttempts < 1
    ) {
      return NextResponse.json(
        { error: 'عدد المحاولات يجب أن يكون 1 أو أكثر' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('private_quizzes')
      .insert({
        title,
        chapter,
        topic,
        description: description || null,
        sort_order: sortOrder,
        duration_minutes: durationMinutes,
        passing_score: passingScore,
        show_result: showResult,
        max_attempts: maxAttempts,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('ADD QUIZ ERROR:', error)

      return NextResponse.json(
        { error: 'حدث خطأ أثناء إضافة الاختبار' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'تمت إضافة الاختبار بنجاح',
      quiz: data,
    })
  } catch (error) {
    console.error('ADD QUIZ REQUEST ERROR:', error)

    return NextResponse.json(
      { error: 'البيانات المرسلة غير صحيحة' },
      { status: 400 }
    )
  }
}

// تعديل الاختبار أو إظهاره وإخفاؤه
export async function PATCH(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: 'غير مصرح بالدخول' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const quizId = Number(body.quizId)

    if (!Number.isInteger(quizId) || quizId < 1) {
      return NextResponse.json(
        { error: 'رقم الاختبار غير صحيح' },
        { status: 400 }
      )
    }

    // إظهار / إخفاء الاختبار
    if (typeof body.isActive === 'boolean') {
      const { data, error } = await supabaseAdmin
        .from('private_quizzes')
        .update({
          is_active: body.isActive,
        })
        .eq('id', quizId)
        .select()
        .single()

      if (error) {
        console.error(
          'TOGGLE QUIZ ERROR:',
          error
        )

        return NextResponse.json(
          {
            error:
              'حدث خطأ أثناء تحديث حالة الاختبار',
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        quiz: data,
      })
    }

    const title = String(body.title ?? '').trim()
    const chapter = String(body.chapter ?? '').trim()
    const topic = String(body.topic ?? '').trim()
    const description = String(
      body.description ?? ''
    ).trim()

    const sortOrder = Number(body.sortOrder ?? 0)
    const durationMinutes = Number(
      body.durationMinutes ?? 0
    )
    const passingScore = Number(
      body.passingScore ?? 50
    )
    const maxAttempts = Number(
      body.maxAttempts ?? 1
    )

    const showResult =
      typeof body.showResult === 'boolean'
        ? body.showResult
        : true

    if (!title || !chapter || !topic) {
      return NextResponse.json(
        {
          error:
            'أدخل اسم الاختبار والفصل والموضوع',
        },
        { status: 400 }
      )
    }

    if (
      !Number.isInteger(sortOrder) ||
      sortOrder < 0 ||
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 0 ||
      !Number.isInteger(passingScore) ||
      passingScore < 0 ||
      passingScore > 100 ||
      !Number.isInteger(maxAttempts) ||
      maxAttempts < 1
    ) {
      return NextResponse.json(
        { error: 'إعدادات الاختبار غير صحيحة' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('private_quizzes')
      .update({
        title,
        chapter,
        topic,
        description: description || null,
        sort_order: sortOrder,
        duration_minutes: durationMinutes,
        passing_score: passingScore,
        show_result: showResult,
        max_attempts: maxAttempts,
      })
      .eq('id', quizId)
      .select()
      .single()

    if (error) {
      console.error('EDIT QUIZ ERROR:', error)

      return NextResponse.json(
        { error: 'حدث خطأ أثناء تعديل الاختبار' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'تم تعديل الاختبار بنجاح',
      quiz: data,
    })
  } catch (error) {
    console.error('EDIT QUIZ REQUEST ERROR:', error)

    return NextResponse.json(
      { error: 'البيانات المرسلة غير صحيحة' },
      { status: 400 }
    )
  }
}