import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function getStudent(request: Request) {
  const cookieHeader =
    request.headers.get('cookie') ?? ''

  const match = cookieHeader.match(
    /(?:^|;\s*)private_student_session=([^;]+)/
  )

  if (!match) {
    return {
      error: 'يجب تسجيل الدخول أولاً',
      status: 401,
    }
  }

  const token = decodeURIComponent(match[1])

  const [studentId, expiresAt, signature] =
    token.split('.')

  if (!studentId || !expiresAt || !signature) {
    return {
      error: 'الجلسة غير صالحة',
      status: 401,
    }
  }

  const id = Number(studentId)
  const expires = Number(expiresAt)

  if (
    !Number.isInteger(id) ||
    id < 1 ||
    !Number.isFinite(expires) ||
    Date.now() > expires
  ) {
    return {
      error: 'انتهت جلسة الدخول',
      status: 401,
    }
  }

  const secret =
    process.env.PRIVATE_SESSION_SECRET

  if (!secret) {
    return {
      error: 'خطأ في إعدادات الخادم',
      status: 500,
    }
  }

  const expectedSignature = createHmac(
    'sha256',
    secret
  )
    .update(`${studentId}.${expiresAt}`)
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
        expectedBuffer.length ||
      !timingSafeEqual(
        signatureBuffer,
        expectedBuffer
      )
    ) {
      return {
        error: 'الجلسة غير صالحة',
        status: 401,
      }
    }
  } catch {
    return {
      error: 'الجلسة غير صالحة',
      status: 401,
    }
  }

  const deviceId =
    request.headers.get('x-device-id')

  if (!deviceId) {
    return {
      error: 'تعذر التحقق من الجهاز',
      status: 401,
    }
  }

  const { data: student, error } =
    await supabaseAdmin
      .from('private_students')
      .select(
        'id, name, is_active, expires_at, device_id'
      )
      .eq('id', id)
      .maybeSingle()

  if (error || !student) {
    return {
      error: 'الطالب غير موجود',
      status: 401,
    }
  }

  if (!student.is_active) {
    return {
      error: 'الاشتراك متوقف',
      status: 403,
    }
  }

  if (
    student.expires_at &&
    new Date(student.expires_at).getTime() <=
      Date.now()
  ) {
    return {
      error: 'انتهى الاشتراك',
      status: 403,
    }
  }

  if (
    !student.device_id ||
    student.device_id !== deviceId
  ) {
    return {
      error:
        'هذه الجلسة غير مرتبطة بالجهاز المعتمد',
      status: 403,
    }
  }

  return {
    student,
    status: 200,
  }
}

export async function GET(request: Request) {
  const auth = await getStudent(request)

  if ('error' in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
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

    const { data: exam, error: examError } =
      await supabaseAdmin
        .from('weekly_exams')
        .select('*')
        .eq('id', examId)
        .eq('is_active', true)
        .maybeSingle()

    if (examError || !exam) {
      return NextResponse.json(
        {
          error:
            'الاختبار غير موجود أو غير مفعّل',
        },
        { status: 404 }
      )
    }

    const now = Date.now()

    if (
      exam.starts_at &&
      new Date(exam.starts_at).getTime() > now
    ) {
      return NextResponse.json(
        { error: 'الاختبار لم يبدأ بعد' },
        { status: 403 }
      )
    }

    const { data: questions, error: questionsError } =
      await supabaseAdmin
        .from('weekly_exam_questions')
        .select(
          'id, question_text, question_image_url, max_score, sort_order'
        )
        .eq('exam_id', examId)
        .order('sort_order', {
          ascending: true,
        })
        .order('id', {
          ascending: true,
        })

    if (questionsError) {
      return NextResponse.json(
        { error: 'تعذر تحميل الأسئلة' },
        { status: 500 }
      )
    }

    let { data: submission, error: submissionError } =
      await supabaseAdmin
        .from('weekly_exam_submissions')
        .select('*')
        .eq('exam_id', examId)
        .eq('student_id', auth.student.id)
        .maybeSingle()

    if (submissionError) {
      return NextResponse.json(
        {
          error:
            'تعذر تحميل حالة تسليم الاختبار',
        },
        { status: 500 }
      )
    }

    const deadlinePassed =
      exam.deadline_at
        ? new Date(exam.deadline_at).getTime() <
          now
        : false

    if (!submission && !deadlinePassed) {
      const {
        data: newSubmission,
        error: createError,
      } = await supabaseAdmin
        .from('weekly_exam_submissions')
        .insert({
          exam_id: examId,
          student_id: auth.student.id,
          status: 'draft',
          final_score: 0,
          earned_points: 0,
        })
        .select()
        .single()

      if (createError) {
        return NextResponse.json(
          {
            error:
              'تعذر بدء حل الاختبار',
          },
          { status: 500 }
        )
      }

      submission = newSubmission
    }

    let answers: Array<{
      id: number
      submission_id: number
      question_id: number
      answer_image_url: string | null
      score: number | null
      teacher_note: string | null
    }> = []

    if (submission) {
      const {
        data: answerRows,
        error: answersError,
      } = await supabaseAdmin
        .from('weekly_exam_answers')
        .select(
          'id, submission_id, question_id, answer_image_url, score, teacher_note'
        )
        .eq('submission_id', submission.id)

      if (answersError) {
        return NextResponse.json(
          {
            error:
              'تعذر تحميل إجابات الطالب',
          },
          { status: 500 }
        )
      }

      answers = answerRows ?? []
    }

    const answerIds = answers.map(
      (answer) => answer.id
    )

    let files: Array<{
      id: number
      answer_id: number
      file_path: string
      sort_order: number
    }> = []

    if (answerIds.length > 0) {
      const {
        data: fileRows,
        error: filesError,
      } = await supabaseAdmin
        .from('weekly_exam_answer_files')
        .select(
          'id, answer_id, file_path, sort_order'
        )
        .in('answer_id', answerIds)
        .order('sort_order', {
          ascending: true,
        })
        .order('id', {
          ascending: true,
        })

      if (filesError) {
        return NextResponse.json(
          {
            error:
              'تعذر تحميل صور الحلول',
          },
          { status: 500 }
        )
      }

      files = fileRows ?? []
    }

    const answerMap = new Map(
      answers.map((answer) => [
        answer.question_id,
        answer,
      ])
    )

    const resultQuestions = await Promise.all(
  (questions ?? []).map(
    async (question) => {
        const answer =
          answerMap.get(question.id) ?? null

      const answerFiles = answer
  ? await Promise.all(
      files
        .filter(
          (file) =>
            file.answer_id === answer.id
        )
        .map(async (file) => {
          const { data: signedData } =
            await supabaseAdmin.storage
              .from('weekly-exam-files')
              .createSignedUrl(
                file.file_path,
                3600
              )

          return {
            id: file.id,
            file_path: file.file_path,
            signed_url:
              signedData?.signedUrl ?? null,
            sort_order: file.sort_order,
          }
        })
    )
  : []
        return {
          id: question.id,
          question_text:
            question.question_text,
          question_image_url:
            question.question_image_url,
          max_score: question.max_score,
          sort_order: question.sort_order,

          answer: answer
            ? {
                id: answer.id,
                score: answer.score,
                teacher_note:
                  answer.teacher_note,
                files: answerFiles,
              }
            : null,
        }
      }
    )
  )
    return NextResponse.json({
      success: true,

      exam: {
        id: exam.id,
        title: exam.title,
        week_number: exam.week_number,
        description: exam.description,
        total_score: exam.total_score,
        points_available:
          exam.points_available,
        starts_at: exam.starts_at,
        deadline_at: exam.deadline_at,
        deadline_passed: deadlinePassed,
      },

      submission: submission
        ? {
            id: submission.id,
            status: submission.status,
            submitted_at:
              submission.submitted_at,
            final_score:
              submission.final_score,
            earned_points:
              submission.earned_points,
            teacher_note:
              submission.teacher_note,
            graded_at:
              submission.graded_at,
          }
        : null,

      questions: resultQuestions,
    })
  } catch {
    return NextResponse.json(
      {
        error:
          'حدث خطأ أثناء تحميل الاختبار',
      },
      { status: 500 }
    )
  }
}