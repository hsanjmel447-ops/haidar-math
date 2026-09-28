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

  if (!secret) {
    return false
  }

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

export async function GET(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      {
        error: 'غير مصرح بالدخول',
      },
      {
        status: 401,
      }
    )
  }

  try {
    const url = new URL(request.url)

    const examId = Number(
      url.searchParams.get('examId')
    )

    if (
      !Number.isInteger(examId) ||
      examId < 1
    ) {
      return NextResponse.json(
        {
          error: 'رقم الاختبار غير صالح',
        },
        {
          status: 400,
        }
      )
    }

    const {
      data: exam,
      error: examError,
    } = await supabaseAdmin
      .from('weekly_exams')
      .select(
        'id, title, week_number, total_score, points_available'
      )
      .eq('id', examId)
      .maybeSingle()

    if (examError || !exam) {
      return NextResponse.json(
        {
          error: 'الاختبار غير موجود',
        },
        {
          status: 404,
        }
      )
    }

    const {
      data: questions,
      error: questionsError,
    } = await supabaseAdmin
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
        {
          error: 'تعذر تحميل أسئلة الاختبار',
        },
        {
          status: 500,
        }
      )
    }

    const {
      data: submissions,
      error: submissionsError,
    } = await supabaseAdmin
      .from('weekly_exam_submissions')
      .select(
        'id, student_id, submitted_at, status, final_score, earned_points, teacher_note, graded_at'
      )
      .eq('exam_id', examId)
      .in('status', ['submitted', 'graded'])
      .order('submitted_at', {
        ascending: true,
      })

    if (submissionsError) {
      return NextResponse.json(
        {
          error:
            'تعذر تحميل تسليمات الطلاب',
        },
        {
          status: 500,
        }
      )
    }

    if (!submissions?.length) {
      return NextResponse.json({
        success: true,
        exam,
        submissions: [],
      })
    }

    const studentIds = [
      ...new Set(
        submissions.map(
          (submission) =>
            submission.student_id
        )
      ),
    ]

    const submissionIds = submissions.map(
      (submission) => submission.id
    )

    const {
      data: students,
      error: studentsError,
    } = await supabaseAdmin
      .from('private_students')
      .select('id, name')
      .in('id', studentIds)

    if (studentsError) {
      return NextResponse.json(
        {
          error:
            'تعذر تحميل بيانات الطلاب',
        },
        {
          status: 500,
        }
      )
    }

    const {
      data: answers,
      error: answersError,
    } = await supabaseAdmin
      .from('weekly_exam_answers')
      .select(
        'id, submission_id, question_id, score, teacher_note'
      )
      .in('submission_id', submissionIds)

    if (answersError) {
      return NextResponse.json(
        {
          error:
            'تعذر تحميل إجابات الطلاب',
        },
        {
          status: 500,
        }
      )
    }

    const answerIds = (answers ?? []).map(
      (answer) => answer.id
    )

    let files: {
      id: number
      answer_id: number
      file_path: string
      sort_order: number
    }[] = []

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

      if (filesError) {
        return NextResponse.json(
          {
            error:
              'تعذر تحميل صور الحلول',
          },
          {
            status: 500,
          }
        )
      }

      files = fileRows ?? []
    }

    const studentMap = new Map(
      (students ?? []).map((student) => [
        student.id,
        student,
      ])
    )

    const resultSubmissions =
      await Promise.all(
        submissions.map(
          async (submission) => {
            const submissionAnswers =
              (answers ?? []).filter(
                (answer) =>
                  answer.submission_id ===
                  submission.id
              )

            const answerMap = new Map(
              submissionAnswers.map(
                (answer) => [
                  answer.question_id,
                  answer,
                ]
              )
            )

            const resultQuestions =
              await Promise.all(
                (questions ?? []).map(
                  async (question) => {
                    const answer =
                      answerMap.get(
                        question.id
                      ) ?? null

                    const answerFiles =
                      answer
                        ? await Promise.all(
                            files
                              .filter(
                                (file) =>
                                  file.answer_id ===
                                  answer.id
                              )
                              .map(
                                async (file) => {
                                  const {
                                    data:
                                      signedData,
                                  } =
                                    await supabaseAdmin.storage
                                      .from(
                                        'weekly-exam-files'
                                      )
                                      .createSignedUrl(
                                        file.file_path,
                                        3600
                                      )

                                  return {
                                    id: file.id,
                                    signed_url:
                                      signedData?.signedUrl ??
                                      null,
                                    sort_order:
                                      file.sort_order,
                                  }
                                }
                              )
                          )
                        : []

                    return {
                      id: question.id,
                      question_text:
                        question.question_text,
                      question_image_url:
                        question.question_image_url,
                      max_score:
                        question.max_score,
                      sort_order:
                        question.sort_order,

                      answer: answer
                        ? {
                            id: answer.id,
                            score:
                              answer.score,
                            teacher_note:
                              answer.teacher_note,
                            files:
                              answerFiles,
                          }
                        : null,
                    }
                  }
                )
              )

            const student =
              studentMap.get(
                submission.student_id
              ) ?? null

            return {
              id: submission.id,
              student_id:
                submission.student_id,
              student_name:
                student?.name ??
                'طالب غير معروف',
              submitted_at:
                submission.submitted_at,
              status: submission.status,
              final_score:
                submission.final_score,
              earned_points:
                submission.earned_points,
              teacher_note:
                submission.teacher_note,
              graded_at:
                submission.graded_at,
              questions:
                resultQuestions,
            }
          }
        )
      )

    return NextResponse.json({
      success: true,
      exam,
      submissions: resultSubmissions,
    })
  } catch {
    return NextResponse.json(
      {
        error:
          'حدث خطأ أثناء تحميل تسليمات الاختبار',
      },
      {
        status: 500,
      }
    )
  }
}