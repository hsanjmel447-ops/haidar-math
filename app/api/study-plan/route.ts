import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error('Supabase environment variables are missing')
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const deviceId = request.headers.get('x-device-id')

    if (!deviceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'تعذر تحديد جهاز الطالب',
        },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    const { data: tasks, error: tasksError } = await supabase
      .from('study_plan_tasks')
      .select(
        'id, plan_name, day_number, title, description, task_type, task_url, sort_order'
      )
      .eq('is_active', true)
      .order('day_number', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true })

    if (tasksError) {
      return NextResponse.json(
        {
          success: false,
          error: 'تعذر تحميل الخطة الدراسية',
        },
        { status: 500 }
      )
    }

    const { data: progress, error: progressError } =
      await supabase
        .from('study_plan_progress')
        .select('task_id, completed')
        .eq('device_id', deviceId)
        .eq('completed', true)

    if (progressError) {
      return NextResponse.json(
        {
          success: false,
          error: 'تعذر تحميل تقدم الطالب',
        },
        { status: 500 }
      )
    }

    const completedTaskIds = new Set(
      (progress ?? []).map((item) => Number(item.task_id))
    )

    const result = (tasks ?? []).map((task) => ({
      ...task,
      completed: completedTaskIds.has(Number(task.id)),
    }))

    return NextResponse.json({
      success: true,
      tasks: result,
    })
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'حدث خطأ أثناء تحميل الخطة الدراسية',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const deviceId = request.headers.get('x-device-id')

    if (!deviceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'تعذر تحديد جهاز الطالب',
        },
        { status: 400 }
      )
    }

    const body = await request.json()
    const taskId = Number(body.taskId)
    const completed = Boolean(body.completed)

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

    const { data: task, error: taskError } = await supabase
      .from('study_plan_tasks')
      .select('id')
      .eq('id', taskId)
      .eq('is_active', true)
      .maybeSingle()

    if (taskError || !task) {
      return NextResponse.json(
        {
          success: false,
          error: 'المهمة غير موجودة',
        },
        { status: 404 }
      )
    }

    if (completed) {
      const { error } = await supabase
        .from('study_plan_progress')
        .upsert(
          {
            device_id: deviceId,
            task_id: taskId,
            completed: true,
            completed_at: new Date().toISOString(),
          },
          {
            onConflict: 'device_id,task_id',
          }
        )

      if (error) {
        return NextResponse.json(
          {
            success: false,
            error: 'تعذر حفظ إنجاز المهمة',
          },
          { status: 500 }
        )
      }
    } else {
      const { error } = await supabase
        .from('study_plan_progress')
        .delete()
        .eq('device_id', deviceId)
        .eq('task_id', taskId)

      if (error) {
        return NextResponse.json(
          {
            success: false,
            error: 'تعذر تحديث المهمة',
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      completed,
    })
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'حدث خطأ أثناء تحديث المهمة',
      },
      { status: 500 }
    )
  }
}