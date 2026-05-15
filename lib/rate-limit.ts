import { supabaseAdmin } from './supabase-admin'

/**
 * Returns true if the request is allowed, false if it should be blocked (429).
 * Inserts an attempt row on each allowed call — uses Supabase as the shared store
 * so it works correctly across Vercel serverless instances.
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowSeconds: number,
): Promise<boolean> {
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString()

  const { count, error } = await supabaseAdmin
    .from('rate_limit_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('key', key)
    .gte('created_at', since)

  if (error) {
    // Fail open — don't block legitimate users if the table is unavailable
    console.error('[rate-limit] count error:', error.message)
    return true
  }

  if ((count ?? 0) >= max) return false

  const { error: insertError } = await supabaseAdmin
    .from('rate_limit_attempts')
    .insert({ key })

  if (insertError) {
    console.error('[rate-limit] insert error:', insertError.message)
  }

  return true
}
