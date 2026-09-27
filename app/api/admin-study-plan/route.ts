import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY

  if (!url || !key) {
    throw new Error('Supabase environment variables are missing')
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

function isAdmin(request: NextRequest) {
  const cookie = request.cookies.get('admin_session')?.value
  const secret = process.env.PRIVATE_SESSION_SECRET

  if (!cookie || !secret) {
    return false
  }

  const parts = cookie.split('.')

  if (parts.length !== 3) {
    return false
  }

  const [name, expiresAt, signature] = parts

  if (name !== 'admin') {
    return false
  }

  const expires = Number(expiresAt)

  if (!Number.isFinite(expires) || Date.now() > expires) {
    return false
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${name}.${expiresAt}`)
    .digest('hex')

  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    )
  ) {
    return false
  }

  return true
}

export async function GET(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('study_plan_tasks')
      .select('*')
      .order('day_number', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true })

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'تعذر تحميل مهام الخطة',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      tasks: data ?? [],
    })
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'حدث خطأ أثناء تحميل الخطة',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const planName =
      String(body.planName || '').trim() || 'خطة 30 يوم'

    const dayNumber = Number(body.dayNumber)
    const title = String(body.title || '').trim()
    const description = String(
      body.description || ''
    ).trim()

    const taskType =
      String(body.taskType || '').trim() || 'study'

    const taskUrl = String(body.taskUrl || '').trim()
    const sortOrder = Number(body.sortOrder ?? 0)

    if (
      !Number.isInteger(dayNumber) ||
      dayNumber < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'رقم اليوم يجب أن يكون 1 أو أكثر',
        },
        { status: 400 }
      )
    }

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error: 'اكتب عنوان المهمة',
        },
        { status: 400 }
      )
    }

    if (
      !Number.isInteger(sortOrder) ||
      sortOrder < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'ترتيب المهمة غير صالح',
        },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('study_plan_tasks')
      .insert({
        plan_name: planName,
        day_number: dayNumber,
        title,
        description: description || null,
        task_type: taskType,
        task_url: taskUrl || null,
        sort_order: sortOrder,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'تعذر إضافة المهمة',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      task: data,
    })
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'حدث خطأ أثناء إضافة المهمة',
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const taskId = Number(body.taskId)

    if (!Number.isInteger(taskId) || taskId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'المهمة غير صالحة',
        },
        { status: 400 }
      )
    }

    const updates: Record<string, unknown> = {}

    if (typeof body.isActive === 'boolean') {
      updates.is_active = body.isActive
    }

    if (body.planName !== undefined) {
      const value = String(body.planName).trim()

      if (!value) {
        return NextResponse.json(
          {
            success: false,
            error: 'اسم الخطة مطلوب',
          },
          { status: 400 }
        )
      }

      updates.plan_name = value
    }

    if (body.dayNumber !== undefined) {
      const value = Number(body.dayNumber)

      if (!Number.isInteger(value) || value < 1) {
        return NextResponse.json(
          {
            success: false,
            error: 'رقم اليوم غير صالح',
          },
          { status: 400 }
        )
      }

      updates.day_number = value
    }

    if (body.title !== undefined) {
      const value = String(body.title).trim()

      if (!value) {
        return NextResponse.json(
          {
            success: false,
            error: 'عنوان المهمة مطلوب',
          },
          { status: 400 }
        )
      }

      updates.title = value
    }

    if (body.description !== undefined) {
      const value = String(body.description).trim()
      updates.description = value || null
    }

    if (body.taskType !== undefined) {
      const value = String(body.taskType).trim()
      updates.task_type = value || 'study'
    }

    if (body.taskUrl !== undefined) {
      const value = String(body.taskUrl).trim()
      updates.task_url = value || null
    }

    if (body.sortOrder !== undefined) {
      const value = Number(body.sortOrder)

      if (!Number.isInteger(value) || value < 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'ترتيب المهمة غير صالح',
          },
          { status: 400 }
        )
      }

      updates.sort_order = value
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'لا توجد تعديلات',
        },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('study_plan_tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'تعذر تعديل المهمة',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      task: data,
    })
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'حدث خطأ أثناء تعديل المهمة',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      )
    }

    const taskId = Number(
      request.nextUrl.searchParams.get('taskId')
    )

    if (!Number.isInteger(taskId) || taskId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'المهمة غير صالحة',
        },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from('study_plan_tasks')
      .delete()
      .eq('id', taskId)

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'تعذر حذف المهمة',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'حدث خطأ أثناء حذف المهمة',
      },
      { status: 500 }
    )
  }
}