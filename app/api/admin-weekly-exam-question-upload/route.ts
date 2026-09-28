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

  const expectedSignature = createHmac(
    'sha256',
    secret
  )
    .update(`admin.${expiresAt}`)
    .digest('hex')

  try {
    const signatureBuffer = Buffer.from(signature, 'hex')
    const expectedBuffer = Buffer.from(
      expectedSignature,
      'hex'
    )

    if (
      signatureBuffer.length !== expectedBuffer.length
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

export async function POST(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: 'غير مصرح بالدخول' },
      { status: 401 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'لم يتم اختيار صورة' },
        { status: 400 }
      )
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'الملف يجب أن يكون صورة' },
        { status: 400 }
      )
    }

    const maxSize = 10 * 1024 * 1024

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'حجم الصورة يجب ألا يتجاوز 10MB' },
        { status: 400 }
      )
    }

    const extension =
      file.name.split('.').pop()?.toLowerCase() || 'jpg'

    const safeExtension = /^[a-z0-9]+$/.test(extension)
      ? extension
      : 'jpg'

    const fileName =
      `questions/${Date.now()}-${crypto.randomUUID()}.${safeExtension}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } =
      await supabaseAdmin.storage
        .from('weekly-exam-files')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        })

    if (uploadError) {
      console.error(uploadError)

      return NextResponse.json(
        { error: 'تعذر رفع صورة السؤال' },
        { status: 500 }
      )
    }

    const { data: signedData, error: signedError } =
      await supabaseAdmin.storage
        .from('weekly-exam-files')
        .createSignedUrl(
          fileName,
          60 * 60 * 24 * 365
        )

    if (signedError || !signedData?.signedUrl) {
      await supabaseAdmin.storage
        .from('weekly-exam-files')
        .remove([fileName])

      return NextResponse.json(
        { error: 'تعذر إنشاء رابط صورة السؤال' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      imageUrl: signedData.signedUrl,
      filePath: fileName,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: 'حدث خطأ أثناء رفع صورة السؤال' },
      { status: 500 }
    )
  }
}