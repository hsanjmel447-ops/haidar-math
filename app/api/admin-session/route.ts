import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'

function verifyAdminSession(token: string) {
  const secret = process.env.PRIVATE_SESSION_SECRET

  if (!secret) {
    throw new Error('PRIVATE_SESSION_SECRET is missing')
  }

  const parts = token.split('.')

  if (parts.length !== 3) {
    return false
  }

  const [role, expiresAtText, receivedSignature] = parts

  if (role !== 'admin') {
    return false
  }

  const expiresAt = Number(expiresAtText)

  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return false
  }

  const payload = `${role}.${expiresAt}`

  const expectedSignature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  const receivedBuffer = Buffer.from(receivedSignature, 'utf8')
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8')

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false
  }

  return timingSafeEqual(receivedBuffer, expectedBuffer)
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_session')?.value

    if (!token || !verifyAdminSession(token)) {
      const response = NextResponse.json(
        {
          success: false,
          message: 'جلسة الإدارة غير صالحة',
        },
        { status: 401 }
      )

      response.cookies.delete('admin_session')

      return response
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('ADMIN SESSION ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'حدث خطأ غير متوقع',
      },
      { status: 500 }
    )
  }
}