// lib/auth.ts — Lógica de autenticación del panel de administración.
// OTP de 6 dígitos + JWT. SOLO importar desde API routes o Server Components.
// Nunca desde Client Components.

import { SignJWT, jwtVerify } from 'jose'
import { supabaseAdmin } from '@/lib/supabase-admin'

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

export const SESSION_COOKIE_NAME = 'sw_admin_session'

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('Missing env var: JWT_SECRET')
  return new TextEncoder().encode(secret)
}

// ---------------------------------------------------------------------------
// isEmailAllowed
// ---------------------------------------------------------------------------

/**
 * Verifica si un email existe en admin_allowlist.
 * Devuelve true si está permitido, false en cualquier otro caso.
 */
export async function isEmailAllowed(email: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('admin_allowlist')
    .select('email')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  if (error) {
    throw new Error(`Error al consultar admin_allowlist: ${error.message}`)
  }

  return data !== null
}

// ---------------------------------------------------------------------------
// createOtp
// ---------------------------------------------------------------------------

/**
 * Genera un código OTP de 6 dígitos válido por 10 minutos.
 * Inserta el código en admin_magic_links (campo token) y lo devuelve.
 */
export async function createOtp(email: string): Promise<string> {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  const { error } = await supabaseAdmin.from('admin_magic_links').insert({
    email: email.toLowerCase().trim(),
    token: code,
    expires_at: expiresAt,
  })

  if (error) {
    throw new Error(`Error al crear OTP: ${error.message}`)
  }

  return code
}

// ---------------------------------------------------------------------------
// verifyOtp
// ---------------------------------------------------------------------------

/**
 * Valida un código OTP para el email dado.
 * Devuelve true si el código es válido y lo marca como usado.
 * Devuelve false si no existe, ya fue usado, o expiró.
 */
export async function verifyOtp(email: string, code: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('admin_magic_links')
    .select('id, used_at, expires_at')
    .eq('email', email.toLowerCase().trim())
    .eq('token', code)
    .maybeSingle()

  if (error) {
    throw new Error(`Error al verificar OTP: ${error.message}`)
  }

  if (!data) return false
  if (data.used_at !== null) return false
  if (new Date(data.expires_at) < new Date()) return false

  // Marcar como usado
  const { error: updateError } = await supabaseAdmin
    .from('admin_magic_links')
    .update({ used_at: new Date().toISOString() })
    .eq('id', data.id)

  if (updateError) {
    throw new Error(`Error al marcar OTP como usado: ${updateError.message}`)
  }

  return true
}

// ---------------------------------------------------------------------------
// createSession
// ---------------------------------------------------------------------------

/**
 * Crea un JWT firmado con el email del admin.
 * Válido por 7 días. Firmado con JWT_SECRET.
 */
export async function createSession(email: string): Promise<string> {
  const secret = getJwtSecret()
  const now = Math.floor(Date.now() / 1000)
  const sevenDaysInSeconds = 7 * 24 * 60 * 60

  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + sevenDaysInSeconds)
    .sign(secret)

  return token
}

// ---------------------------------------------------------------------------
// verifySession
// ---------------------------------------------------------------------------

/**
 * Verifica y decodifica un JWT de sesión.
 * Devuelve el email si el token es válido, null si no.
 */
export async function verifySession(token: string): Promise<string | null> {
  try {
    const secret = getJwtSecret()
    const { payload } = await jwtVerify(token, secret)

    if (typeof payload.email !== 'string') return null

    return payload.email
  } catch {
    // Token inválido, expirado o malformado
    return null
  }
}
