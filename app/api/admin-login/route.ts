import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

function safeCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a)
  const bBuffer = Buffer.from(b)

  if (aBuffer.length !== bBuffer.length) {
    return false
  }

  return timingSafeEqual(aBuffer, bBuffer)
}

function createAdminSession() {
  const secret = process.env.PRIVATE_SESSION_SECRET

  if (!secret) {
    throw new Error('PRIVATE_SESSION_SECRET is missing')
  }

  const expiresAt = Date.now() + 24 * 60 * 60 * 1000
  const payload = `admin.${expiresAt}`

  const signature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return {
    token: `${payload}.${signature}`,
    expiresAt,
  }
}

export async function POST(request: Request) {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminPassword) {
      throw new Error('ADMIN_PASSWORD is missing')
    }

    const body = await request.json()
    const password = String(body.password ?? '')

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          message: 'أدخل كلمة مرور الإدارة',
        },
        { status: 400 }
      )
    }

    if (!safeCompare(password, adminPassword)) {
      return NextResponse.json(
        {
          success: false,
          message: 'كلمة المرور غير صحيحة',
        },
        { status: 401 }
      )
    }

    const session = createAdminSession()

    const response = NextResponse.json({
      success: true,
    })

    response.cookies.set({
      name: 'admin_session',
      value: session.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: new Date(session.expiresAt),
    })

    return response
  } catch (error) {
    console.error('ADMIN LOGIN ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'حدث خطأ غير متوقع',
      },
      { status: 500 }
    )
  }
}