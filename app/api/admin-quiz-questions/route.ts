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

// جلب أسئلة اختبار معين
export async function GET(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: 'غير مصرح بالدخول' },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const quizId = Number(searchParams.get('quizId'))

  if (!Number.isInteger(quizId) || quizId < 1) {
    return NextResponse.json(
      { error: 'رقم الاختبار غير صحيح' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('private_quiz_questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('LOAD QUIZ QUESTIONS ERROR:', error)

    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحميل الأسئلة' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    questions: data ?? [],
  })
}

// إضافة سؤال
export async function POST(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: 'غير مصرح بالدخول' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()

    const quizId = Number(body.quizId)
    const questionText = String(
      body.questionText ?? ''
    ).trim()

    const optionA = String(body.optionA ?? '').trim()
    const optionB = String(body.optionB ?? '').trim()
    const optionC = String(body.optionC ?? '').trim()
    const optionD = String(body.optionD ?? '').trim()

    const correctOption = String(
      body.correctOption ?? ''
    )
      .trim()
      .toUpperCase()

    const sortOrder = Number(body.sortOrder ?? 0)
    const points = Number(body.points ?? 1)

    const explanation = String(
      body.explanation ?? ''
    ).trim()

    if (!Number.isInteger(quizId) || quizId < 1) {
      return NextResponse.json(
        { error: 'رقم الاختبار غير صحيح' },
        { status: 400 }
      )
    }

    if (!questionText) {
      return NextResponse.json(
        { error: 'أدخل نص السؤال' },
        { status: 400 }
      )
    }

    if (!optionA || !optionB || !optionC || !optionD) {
      return NextResponse.json(
        { error: 'أدخل الخيارات الأربعة للسؤال' },
        { status: 400 }
      )
    }

    if (
      !['A', 'B', 'C', 'D'].includes(correctOption)
    ) {
      return NextResponse.json(
        {
          error:
            'حدد الإجابة الصحيحة: A أو B أو C أو D',
        },
        { status: 400 }
      )
    }

    if (
      !Number.isInteger(sortOrder) ||
      sortOrder < 0
    ) {
      return NextResponse.json(
        { error: 'ترتيب السؤال غير صحيح' },
        { status: 400 }
      )
    }

    if (!Number.isInteger(points) || points < 1) {
      return NextResponse.json(
        { error: 'درجة السؤال يجب أن تكون 1 أو أكثر' },
        { status: 400 }
      )
    }

    // نتأكد أن الاختبار موجود
    const { data: quiz, error: quizError } =
      await supabaseAdmin
        .from('private_quizzes')
        .select('id')
        .eq('id', quizId)
        .maybeSingle()

    if (quizError || !quiz) {
      return NextResponse.json(
        { error: 'الاختبار غير موجود' },
        { status: 404 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('private_quiz_questions')
      .insert({
        quiz_id: quizId,
        question_text: questionText,
        option_a: optionA,
        option_b: optionB,
        option_c: optionC,
        option_d: optionD,
        correct_option: correctOption,
        sort_order: sortOrder,
        points,
        explanation: explanation || null,
      })
      .select()
      .single()

    if (error) {
      console.error('ADD QUIZ QUESTION ERROR:', error)

      return NextResponse.json(
        { error: 'حدث خطأ أثناء إضافة السؤال' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'تمت إضافة السؤال بنجاح',
      question: data,
    })
  } catch (error) {
    console.error('ADD QUIZ QUESTION REQUEST ERROR:', error)

    return NextResponse.json(
      { error: 'البيانات المرسلة غير صحيحة' },
      { status: 400 }
    )
  }
}

// تعديل سؤال
export async function PATCH(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: 'غير مصرح بالدخول' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()

    const questionId = Number(body.questionId)

    if (
      !Number.isInteger(questionId) ||
      questionId < 1
    ) {
      return NextResponse.json(
        { error: 'رقم السؤال غير صحيح' },
        { status: 400 }
      )
    }

    const questionText = String(
      body.questionText ?? ''
    ).trim()

    const optionA = String(body.optionA ?? '').trim()
    const optionB = String(body.optionB ?? '').trim()
    const optionC = String(body.optionC ?? '').trim()
    const optionD = String(body.optionD ?? '').trim()

    const correctOption = String(
      body.correctOption ?? ''
    )
      .trim()
      .toUpperCase()

    const sortOrder = Number(body.sortOrder ?? 0)
    const points = Number(body.points ?? 1)

    const explanation = String(
      body.explanation ?? ''
    ).trim()

    if (
      !questionText ||
      !optionA ||
      !optionB ||
      !optionC ||
      !optionD
    ) {
      return NextResponse.json(
        {
          error:
            'أدخل السؤال والخيارات الأربعة',
        },
        { status: 400 }
      )
    }

    if (
      !['A', 'B', 'C', 'D'].includes(correctOption)
    ) {
      return NextResponse.json(
        { error: 'الإجابة الصحيحة غير صحيحة' },
        { status: 400 }
      )
    }

    if (
      !Number.isInteger(sortOrder) ||
      sortOrder < 0 ||
      !Number.isInteger(points) ||
      points < 1
    ) {
      return NextResponse.json(
        { error: 'ترتيب أو درجة السؤال غير صحيحة' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('private_quiz_questions')
      .update({
        question_text: questionText,
        option_a: optionA,
        option_b: optionB,
        option_c: optionC,
        option_d: optionD,
        correct_option: correctOption,
        sort_order: sortOrder,
        points,
        explanation: explanation || null,
      })
      .eq('id', questionId)
      .select()
      .single()

    if (error) {
      console.error('EDIT QUIZ QUESTION ERROR:', error)

      return NextResponse.json(
        { error: 'حدث خطأ أثناء تعديل السؤال' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'تم تعديل السؤال بنجاح',
      question: data,
    })
  } catch (error) {
    console.error('EDIT QUIZ QUESTION REQUEST ERROR:', error)

    return NextResponse.json(
      { error: 'البيانات المرسلة غير صحيحة' },
      { status: 400 }
    )
  }
}

// حذف سؤال
export async function DELETE(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: 'غير مصرح بالدخول' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const questionId = Number(body.questionId)

    if (
      !Number.isInteger(questionId) ||
      questionId < 1
    ) {
      return NextResponse.json(
        { error: 'رقم السؤال غير صحيح' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('private_quiz_questions')
      .delete()
      .eq('id', questionId)

    if (error) {
      console.error('DELETE QUIZ QUESTION ERROR:', error)

      return NextResponse.json(
        { error: 'حدث خطأ أثناء حذف السؤال' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف السؤال بنجاح',
    })
  } catch (error) {
    console.error(
      'DELETE QUIZ QUESTION REQUEST ERROR:',
      error
    )

    return NextResponse.json(
      { error: 'البيانات المرسلة غير صحيحة' },
      { status: 400 }
    )
  }
}