import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'

function isAdmin(request: Request) {
  const cookieHeader =
    request.headers.get('cookie') ?? ''

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

  const expectedSignature = createHmac(
    'sha256',
    secret
  )
    .update(payload)
    .digest('hex')

  try {
    const signatureBuffer = Buffer.from(
      signature,
      'hex'
    )

    const expectedBuffer = Buffer.from(
      expectedSignature,
      'hex'
    )

    if (
      signatureBuffer.length !==
      expectedBuffer.length
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

export async function GET(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: 'غير مصرح بالدخول' },
      { status: 401 }
    )
  }

  try {
    const url = new URL(request.url)
    const examId = Number(
      url.searchParams.get('examId')
    )

    if (
      !Number.isInteger(examId) ||
      examId <= 0
    ) {
      return NextResponse.json(
        { error: 'الاختبار غير صالح' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('weekly_exam_questions')
      .select('*')
      .eq('exam_id', examId)
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: 'تعذر تحميل أسئلة الاختبار' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      questions: data ?? [],
    })
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحميل الأسئلة' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: 'غير مصرح بالدخول' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()

    const examId = Number(body.examId)
    const questionText = String(
      body.questionText ?? ''
    ).trim()

    const questionImageUrl = String(
      body.questionImageUrl ?? ''
    ).trim()

    const maxScore = Number(body.maxScore)
    const sortOrder = Number(body.sortOrder ?? 0)

    if (
      !Number.isInteger(examId) ||
      examId <= 0
    ) {
      return NextResponse.json(
        { error: 'الاختبار غير صالح' },
        { status: 400 }
      )
    }

    if (!questionText && !questionImageUrl) {
      return NextResponse.json(
        {
          error:
            'يجب إضافة نص للسؤال أو صورة للسؤال',
        },
        { status: 400 }
      )
    }

    if (
      !Number.isInteger(maxScore) ||
      maxScore <= 0
    ) {
      return NextResponse.json(
        { error: 'درجة السؤال غير صالحة' },
        { status: 400 }
      )
    }

    if (
      !Number.isInteger(sortOrder) ||
      sortOrder < 0
    ) {
      return NextResponse.json(
        { error: 'ترتيب السؤال غير صالح' },
        { status: 400 }
      )
    }

    const { data: exam, error: examError } =
      await supabaseAdmin
        .from('weekly_exams')
        .select('id, total_score')
        .eq('id', examId)
        .maybeSingle()

    if (examError || !exam) {
      return NextResponse.json(
        { error: 'الاختبار غير موجود' },
        { status: 404 }
      )
    }

    const { data: currentQuestions, error: sumError } =
      await supabaseAdmin
        .from('weekly_exam_questions')
        .select('max_score')
        .eq('exam_id', examId)

    if (sumError) {
      return NextResponse.json(
        { error: 'تعذر التحقق من درجات الأسئلة' },
        { status: 500 }
      )
    }

    const currentTotal = (currentQuestions ?? []).reduce(
      (sum, question) =>
        sum + Number(question.max_score || 0),
      0
    )

    if (
      currentTotal + maxScore >
      Number(exam.total_score)
    ) {
      return NextResponse.json(
        {
          error: `مجموع درجات الأسئلة سيتجاوز الدرجة الكلية للاختبار (${exam.total_score})`,
        },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('weekly_exam_questions')
      .insert({
        exam_id: examId,
        question_text: questionText || 'سؤال بصورة',
        question_image_url: questionImageUrl || null,
        max_score: maxScore,
        sort_order: sortOrder,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'تعذر إضافة السؤال' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      question: data,
    })
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إضافة السؤال' },
      { status: 500 }
    )
  }
}

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
      questionId <= 0
    ) {
      return NextResponse.json(
        { error: 'السؤال غير صالح' },
        { status: 400 }
      )
    }

    const { data: currentQuestion, error: currentError } =
      await supabaseAdmin
        .from('weekly_exam_questions')
        .select('id, exam_id, max_score')
        .eq('id', questionId)
        .maybeSingle()

    if (currentError || !currentQuestion) {
      return NextResponse.json(
        { error: 'السؤال غير موجود' },
        { status: 404 }
      )
    }

    const updates: Record<string, unknown> = {}

    if (body.questionText !== undefined) {
      updates.question_text =
        String(body.questionText).trim() ||
        'سؤال بصورة'
    }

    if (body.questionImageUrl !== undefined) {
      const imageUrl = String(
        body.questionImageUrl
      ).trim()

      updates.question_image_url =
        imageUrl || null
    }

    if (body.sortOrder !== undefined) {
      const sortOrder = Number(body.sortOrder)

      if (
        !Number.isInteger(sortOrder) ||
        sortOrder < 0
      ) {
        return NextResponse.json(
          { error: 'ترتيب السؤال غير صالح' },
          { status: 400 }
        )
      }

      updates.sort_order = sortOrder
    }

    if (body.maxScore !== undefined) {
      const maxScore = Number(body.maxScore)

      if (
        !Number.isInteger(maxScore) ||
        maxScore <= 0
      ) {
        return NextResponse.json(
          { error: 'درجة السؤال غير صالحة' },
          { status: 400 }
        )
      }

      const { data: exam } = await supabaseAdmin
        .from('weekly_exams')
        .select('total_score')
        .eq('id', currentQuestion.exam_id)
        .single()

      const { data: otherQuestions } =
        await supabaseAdmin
          .from('weekly_exam_questions')
          .select('max_score')
          .eq('exam_id', currentQuestion.exam_id)
          .neq('id', questionId)

      const otherTotal = (otherQuestions ?? []).reduce(
        (sum, question) =>
          sum + Number(question.max_score || 0),
        0
      )

      if (
        exam &&
        otherTotal + maxScore >
          Number(exam.total_score)
      ) {
        return NextResponse.json(
          {
            error: `مجموع درجات الأسئلة سيتجاوز الدرجة الكلية للاختبار (${exam.total_score})`,
          },
          { status: 400 }
        )
      }

      updates.max_score = maxScore
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'لا توجد تعديلات' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('weekly_exam_questions')
      .update(updates)
      .eq('id', questionId)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'تعذر تعديل السؤال' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      question: data,
    })
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تعديل السؤال' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: 'غير مصرح بالدخول' },
      { status: 401 }
    )
  }

  try {
    const url = new URL(request.url)

    const questionId = Number(
      url.searchParams.get('questionId')
    )

    if (
      !Number.isInteger(questionId) ||
      questionId <= 0
    ) {
      return NextResponse.json(
        { error: 'السؤال غير صالح' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('weekly_exam_questions')
      .delete()
      .eq('id', questionId)

    if (error) {
      return NextResponse.json(
        { error: 'تعذر حذف السؤال' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف السؤال' },
      { status: 500 }
    )
  }
}