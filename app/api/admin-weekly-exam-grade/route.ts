import { NextResponse } from 'next/server'
import {
  createHmac,
  timingSafeEqual,
} from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'

function isAdmin(request: Request) {
  const cookieHeader =
    request.headers.get('cookie') ?? ''

  const match = cookieHeader.match(
    /(?:^|;\s*)admin_session=([^;]+)/
  )

  if (!match) return false

  const token = decodeURIComponent(match[1])

  const [admin, expiresAt, signature] =
    token.split('.')

  if (
    admin !== 'admin' ||
    !expiresAt ||
    !signature
  ) {
    return false
  }

  const expires = Number(expiresAt)

  if (
    !Number.isFinite(expires) ||
    Date.now() > expires
  ) {
    return false
  }

  const secret =
    process.env.PRIVATE_SESSION_SECRET

  if (!secret) return false

  const expectedSignature = createHmac(
    'sha256',
    secret
  )
    .update(`${admin}.${expiresAt}`)
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

type GradeItem = {
  questionId: number
  score: number
  teacherNote?: string
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

    const submissionId = Number(
      body.submissionId
    )

    const grades = body.grades as
      | GradeItem[]
      | undefined

    const teacherNote =
      typeof body.teacherNote === 'string'
        ? body.teacherNote.trim()
        : ''

    if (
      !Number.isInteger(submissionId) ||
      submissionId < 1
    ) {
      return NextResponse.json(
        { error: 'رقم التسليم غير صالح' },
        { status: 400 }
      )
    }

    if (!Array.isArray(grades)) {
      return NextResponse.json(
        { error: 'بيانات التصحيح غير صالحة' },
        { status: 400 }
      )
    }

    const {
      data: submission,
      error: submissionError,
    } = await supabaseAdmin
      .from('weekly_exam_submissions')
      .select(
        'id, exam_id, student_id, status'
      )
      .eq('id', submissionId)
      .maybeSingle()

    if (
      submissionError ||
      !submission
    ) {
      return NextResponse.json(
        { error: 'التسليم غير موجود' },
        { status: 404 }
      )
    }

    if (
      submission.status !== 'submitted' &&
      submission.status !== 'graded'
    ) {
      return NextResponse.json(
        {
          error:
            'هذا الاختبار لم يتم تسليمه بعد',
        },
        { status: 400 }
      )
    }

    const {
      data: exam,
      error: examError,
    } = await supabaseAdmin
      .from('weekly_exams')
      .select(
        'id, title, total_score, points_available'
      )
      .eq('id', submission.exam_id)
      .maybeSingle()

    if (examError || !exam) {
      return NextResponse.json(
        { error: 'الاختبار غير موجود' },
        { status: 404 }
      )
    }

    const {
      data: questions,
      error: questionsError,
    } = await supabaseAdmin
      .from('weekly_exam_questions')
      .select('id, max_score')
      .eq('exam_id', exam.id)

    if (
      questionsError ||
      !questions?.length
    ) {
      return NextResponse.json(
        {
          error:
            'لا توجد أسئلة لهذا الاختبار',
        },
        { status: 400 }
      )
    }

    const gradeMap = new Map<
      number,
      GradeItem
    >()

    for (const grade of grades) {
      const questionId = Number(
        grade.questionId
      )

      const score = Number(grade.score)

      if (
        !Number.isInteger(questionId) ||
        questionId < 1 ||
        !Number.isFinite(score)
      ) {
        return NextResponse.json(
          {
            error:
              'توجد درجة غير صالحة',
          },
          { status: 400 }
        )
      }

      if (gradeMap.has(questionId)) {
        return NextResponse.json(
          {
            error:
              'يوجد سؤال مكرر في التصحيح',
          },
          { status: 400 }
        )
      }

      gradeMap.set(questionId, {
        questionId,
        score,
        teacherNote:
          typeof grade.teacherNote ===
          'string'
            ? grade.teacherNote.trim()
            : '',
      })
    }

    let finalScore = 0

    for (const question of questions) {
      const grade =
        gradeMap.get(question.id)

      const score = grade
        ? Number(grade.score)
        : 0

      if (
        score < 0 ||
        score > Number(question.max_score)
      ) {
        return NextResponse.json(
          {
            error: `درجة أحد الأسئلة يجب أن تكون بين 0 و ${question.max_score}`,
          },
          { status: 400 }
        )
      }

      finalScore += score
    }

    if (
      finalScore >
      Number(exam.total_score)
    ) {
      return NextResponse.json(
        {
          error:
            'الدرجة النهائية تجاوزت درجة الاختبار',
        },
        { status: 400 }
      )
    }

    for (const question of questions) {
      const grade =
        gradeMap.get(question.id)

      const {
        data: existingAnswer,
        error: answerLookupError,
      } = await supabaseAdmin
        .from('weekly_exam_answers')
        .select('id')
        .eq(
          'submission_id',
          submission.id
        )
        .eq('question_id', question.id)
        .maybeSingle()

      if (answerLookupError) {
        return NextResponse.json(
          {
            error:
              'تعذر تحميل إجابات الطالب',
          },
          { status: 500 }
        )
      }

      const score = grade
        ? Number(grade.score)
        : 0

      const note =
        grade?.teacherNote ?? ''

      if (existingAnswer) {
        const { error: updateError } =
          await supabaseAdmin
            .from('weekly_exam_answers')
            .update({
              score,
              teacher_note:
                note || null,
            })
            .eq(
              'id',
              existingAnswer.id
            )

        if (updateError) {
          return NextResponse.json(
            {
              error:
                'تعذر حفظ درجة أحد الأسئلة',
            },
            { status: 500 }
          )
        }
      } else {
        const { error: insertError } =
          await supabaseAdmin
            .from('weekly_exam_answers')
            .insert({
              submission_id:
                submission.id,
              question_id: question.id,
              score,
              teacher_note:
                note || null,
            })

        if (insertError) {
          return NextResponse.json(
            {
              error:
                'تعذر إنشاء تصحيح السؤال',
            },
            { status: 500 }
          )
        }
      }
    }

    const totalScore =
      Number(exam.total_score)

    const pointsAvailable =
      Number(exam.points_available)

    const earnedPoints =
      totalScore > 0
        ? Math.round(
            (finalScore / totalScore) *
              pointsAvailable
          )
        : 0

    const gradedAt =
      new Date().toISOString()

    const { error: updateSubmissionError } =
      await supabaseAdmin
        .from('weekly_exam_submissions')
        .update({
          status: 'graded',
          final_score: finalScore,
          earned_points: earnedPoints,
          teacher_note:
            teacherNote || null,
          graded_at: gradedAt,
        })
        .eq('id', submission.id)

    if (updateSubmissionError) {
      return NextResponse.json(
        {
          error:
            'تعذر حفظ النتيجة النهائية',
        },
        { status: 500 }
      )
    }

    if (earnedPoints > 0) {
      const {
        data: existingPoints,
        error: pointsLookupError,
      } = await supabaseAdmin
        .from('private_student_points')
        .select('id')
        .eq(
          'student_id',
          submission.student_id
        )
        .eq('exam_id', exam.id)
        .maybeSingle()

      if (pointsLookupError) {
        return NextResponse.json(
          {
            error:
              'تم حفظ الدرجة لكن تعذر التحقق من النقاط',
          },
          { status: 500 }
        )
      }

      if (existingPoints) {
        const { error: pointsUpdateError } =
          await supabaseAdmin
            .from(
              'private_student_points'
            )
            .update({
              points: earnedPoints,
              reason: `اختبار أسبوعي: ${exam.title}`,
            })
            .eq(
              'id',
              existingPoints.id
            )

        if (pointsUpdateError) {
          return NextResponse.json(
            {
              error:
                'تم حفظ الدرجة لكن تعذر تحديث النقاط',
            },
            { status: 500 }
          )
        }
      } else {
        const { error: pointsInsertError } =
          await supabaseAdmin
            .from(
              'private_student_points'
            )
            .insert({
              student_id:
                submission.student_id,
              points: earnedPoints,
              reason: `اختبار أسبوعي: ${exam.title}`,
              exam_id: exam.id,
            })

        if (pointsInsertError) {
          return NextResponse.json(
            {
              error:
                'تم حفظ الدرجة لكن تعذر إضافة النقاط',
            },
            { status: 500 }
          )
        }
      }
    } else {
      const { error: deletePointsError } =
        await supabaseAdmin
          .from('private_student_points')
          .delete()
          .eq(
            'student_id',
            submission.student_id
          )
          .eq('exam_id', exam.id)

      if (deletePointsError) {
        return NextResponse.json(
          {
            error:
              'تم حفظ الدرجة لكن تعذر تحديث النقاط',
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      final_score: finalScore,
      total_score: totalScore,
      earned_points: earnedPoints,
      points_available:
        pointsAvailable,
      graded_at: gradedAt,
    })
  } catch {
    return NextResponse.json(
      {
        error:
          'حدث خطأ أثناء حفظ التصحيح',
      },
      { status: 500 }
    )
  }
}