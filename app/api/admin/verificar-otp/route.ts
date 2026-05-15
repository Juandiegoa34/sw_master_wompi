// Valida el OTP ingresado por el admin. Si es correcto, crea la sesión JWT
// y la almacena en una cookie httpOnly. El cliente redirige vía window.location.href.

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyOtp, createSession, SESSION_COOKIE_NAME } from '@src/shared/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  const allowed = await checkRateLimit(`otp-verify:${ip}`, 10, 600)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera 10 minutos e intenta de nuevo.' },
      { status: 429 },
    )
  }
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo de la solicitud inválido.' }, { status: 400 })
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('email' in body) ||
    !('code' in body) ||
    typeof (body as Record<string, unknown>).email !== 'string' ||
    typeof (body as Record<string, unknown>).code !== 'string'
  ) {
    return NextResponse.json({ error: 'Los campos email y code son obligatorios.' }, { status: 400 })
  }

  const email = ((body as Record<string, string>).email).trim()
  const code = ((body as Record<string, string>).code).trim()

  if (!email || !code) {
    return NextResponse.json({ error: 'Los campos email y code son obligatorios.' }, { status: 400 })
  }

  try {
    const valid = await verifyOtp(email, code)

    if (!valid) {
      return NextResponse.json({ error: 'Código inválido o expirado' }, { status: 400 })
    }

    const sessionToken = await createSession(email)

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    console.error('[POST /api/admin/verificar-otp] Error interno:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
