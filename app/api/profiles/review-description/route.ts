import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requestReview } from '@src/features/profile-editorial-review/service'

const bodySchema = z.object({
  description: z.string().min(10, 'Descripción demasiado corta.').max(300, 'Descripción demasiado larga.'),
  source: z.enum(['user_form', 'admin_panel']).default('user_form'),
})

// djb2-style hash — produces a short hex string from any string input
function shortHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

function buildSessionKey(request: NextRequest): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const userAgent = request.headers.get('user-agent') ?? ''
  return `editorial-review:${ip}:${shortHash(userAgent)}`
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, message: 'Request body inválido.' },
      { status: 400 },
    )
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.issues[0].message },
      { status: 400 },
    )
  }

  const sessionKey = buildSessionKey(request)

  const result = await requestReview({
    description: parsed.data.description,
    sessionKey,
    source: parsed.data.source,
  })

  if (!result.ok) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: result.status },
    )
  }

  return NextResponse.json({ success: true, ...result.data })
}
