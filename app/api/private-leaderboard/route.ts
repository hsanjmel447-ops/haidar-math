import { NextResponse } from 'next/server'
import {
  createHmac,
  timingSafeEqual,
} from 'crypto'
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

  const token =
    decodeURIComponent(match[1])

  const [
    studentId,
    expiresAt,
    signature,
  ] = token.split('.')

  if (
    !studentId ||
    !expiresAt ||
    !signature
  ) {
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
    const signatureBuffer =
      Buffer.from(signature, 'hex')

    const expectedBuffer =
      Buffer.from(
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

  const {
    data: student,
    error,
  } = await supabaseAdmin
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
    new Date(
      student.expires_at
    ).getTime() <= Date.now()
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
        'هذا الحساب مرتبط بجهاز آخر',
      status: 403,
    }
  }

  return {
    student,
    status: 200,
  }
}

export async function GET(
  request: Request
) {
  const auth = await getStudent(request)

  if (!auth.student) {
    return NextResponse.json(
      {
        error:
          auth.error ??
          'غير مصرح بالدخول',
      },
      {
        status: auth.status,
      }
    )
  }

  try {
    const {
      data: students,
      error: studentsError,
    } = await supabaseAdmin
      .from('private_students')
      .select('id, name')
      .eq('is_active', true)

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
      data: points,
      error: pointsError,
    } = await supabaseAdmin
      .from('private_student_points')
      .select(
        'student_id, points, exam_id'
      )

    if (pointsError) {
      return NextResponse.json(
        {
          error:
            'تعذر تحميل نقاط النخبة',
        },
        {
          status: 500,
        }
      )
    }

    const totals = new Map<
      number,
      number
    >()

    for (const point of points ?? []) {
      const current =
        totals.get(
          point.student_id
        ) ?? 0

      totals.set(
        point.student_id,
        current + Number(point.points)
      )
    }

    const leaderboard = (
      students ?? []
    )
      .map((student) => ({
        student_id: student.id,
        name: student.name,
        points:
          totals.get(student.id) ?? 0,
      }))
      .sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points
        }

        return a.name.localeCompare(
          b.name,
          'ar'
        )
      })
      .map((student, index) => ({
        ...student,
        rank: index + 1,
      }))

    const myEntry =
      leaderboard.find(
        (entry) =>
          entry.student_id ===
          auth.student.id
      ) ?? null

    let gapToNext = 0

    if (
      myEntry &&
      myEntry.rank > 1
    ) {
      const previous =
        leaderboard[
          myEntry.rank - 2
        ]

      if (previous) {
        gapToNext = Math.max(
          0,
          previous.points -
            myEntry.points
        )
      }
    }

    return NextResponse.json({
      success: true,

      leaderboard:
        leaderboard.slice(0, 20),

      me: myEntry
        ? {
            student_id:
              myEntry.student_id,
            name: myEntry.name,
            points: myEntry.points,
            rank: myEntry.rank,
            gap_to_next: gapToNext,
          }
        : null,

      total_students:
        leaderboard.length,
    })
  } catch {
    return NextResponse.json(
      {
        error:
          'حدث خطأ أثناء تحميل لوحة النخبة',
      },
      {
        status: 500,
      }
    )
  }
}