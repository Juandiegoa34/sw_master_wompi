import { supabaseAdmin } from '@src/shared/lib/supabase-admin'
import type { MembershipAlert } from '../types'

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/** Normaliza relaciones 1:1 que Supabase puede devolver como {} o [{}]. */
function one<T>(raw: T | T[] | null | undefined): T | null {
  if (raw === null || raw === undefined) return null
  return Array.isArray(raw) ? (raw[0] ?? null) : raw
}

/** Suma días a la fecha actual y devuelve ISO string. */
function addDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

// ---------------------------------------------------------------------------
// getMembershipAlerts
// ---------------------------------------------------------------------------

export async function getMembershipAlerts(): Promise<MembershipAlert[]> {
  const sevenDaysFromNow = addDays(7)

  const { data, error } = await supabaseAdmin
    .from('memberships')
    .select(`
      entrepreneur_id, end_at,
      entrepreneurs ( full_name ),
      business_profiles:entrepreneurs!inner (
        business_profiles ( business_name )
      )
    `)
    .eq('status', 'active')
    .lt('end_at', sevenDaysFromNow)
    .returns<{
      entrepreneur_id: string
      end_at: string
      entrepreneurs: { full_name: string | null } | { full_name: string | null }[] | null
      business_profiles: { business_profiles: { business_name: string | null } | { business_name: string | null }[] | null } | { business_profiles: { business_name: string | null } | { business_name: string | null }[] | null }[] | null
    }[]>()

  if (error) {
    return getMembershipAlertsFallback(sevenDaysFromNow)
  }

  if (!data || data.length === 0) return []

  return buildAlerts(data)
}

// Fallback: si el join indirecto no funciona, usar dos queries + JS merge
async function getMembershipAlertsFallback(sevenDaysFromNow: string): Promise<MembershipAlert[]> {
  const { data: mems, error: memError } = await supabaseAdmin
    .from('memberships')
    .select('entrepreneur_id, end_at')
    .eq('status', 'active')
    .lt('end_at', sevenDaysFromNow)
    .returns<{ entrepreneur_id: string; end_at: string }[]>()

  if (memError) throw new Error(memError.message)
  if (!mems || mems.length === 0) return []

  const ids = mems.map((m) => m.entrepreneur_id)

  const { data: entrepreneurs, error: entError } = await supabaseAdmin
    .from('entrepreneurs')
    .select('id, full_name')
    .in('id', ids)
    .returns<{ id: string; full_name: string | null }[]>()

  if (entError) throw new Error(entError.message)

  const { data: profiles, error: profError } = await supabaseAdmin
    .from('business_profiles')
    .select('entrepreneur_id, business_name')
    .in('entrepreneur_id', ids)
    .returns<{ entrepreneur_id: string; business_name: string | null }[]>()

  if (profError) throw new Error(profError.message)

  const entMap = new Map((entrepreneurs ?? []).map((e) => [e.id, e.full_name]))
  const profMap = new Map((profiles ?? []).map((p) => [p.entrepreneur_id, p.business_name]))

  const alerts: MembershipAlert[] = mems.map((m) => ({
    entrepreneur_id: m.entrepreneur_id,
    full_name: entMap.get(m.entrepreneur_id) ?? null,
    business_name: profMap.get(m.entrepreneur_id) ?? null,
    membership_end: m.end_at,
    days_remaining: Math.floor(
      (new Date(m.end_at).getTime() - Date.now()) / 86_400_000
    ),
  }))

  return alerts.sort((a, b) => a.days_remaining - b.days_remaining)
}

// Helper para construir alertas desde la respuesta del join principal
function buildAlerts(
  data: {
    entrepreneur_id: string
    end_at: string
    entrepreneurs: { full_name: string | null } | { full_name: string | null }[] | null
    business_profiles: unknown
  }[]
): MembershipAlert[] {
  const alerts: MembershipAlert[] = data.map((row) => {
    const ent = one(row.entrepreneurs)

    let businessName: string | null = null
    const bpOuter = one(row.business_profiles as { business_profiles: unknown } | { business_profiles: unknown }[] | null)
    if (bpOuter) {
      const bpInner = one((bpOuter as { business_profiles: { business_name: string | null } | { business_name: string | null }[] | null }).business_profiles)
      businessName = bpInner?.business_name ?? null
    }

    return {
      entrepreneur_id: row.entrepreneur_id,
      full_name: ent?.full_name ?? null,
      business_name: businessName,
      membership_end: row.end_at,
      days_remaining: Math.floor(
        (new Date(row.end_at).getTime() - Date.now()) / 86_400_000
      ),
    }
  })

  return alerts.sort((a, b) => a.days_remaining - b.days_remaining)
}

// ---------------------------------------------------------------------------
// toggleMembership
// ---------------------------------------------------------------------------

export async function toggleMembership(
  entrepreneurId: string,
  newStatus: 'active' | 'inactive'
): Promise<void> {
  const update: Record<string, unknown> = { status: newStatus }

  if (newStatus === 'inactive') {
    update.end_at = new Date().toISOString()
  }

  const { error } = await supabaseAdmin
    .from('memberships')
    .update(update)
    .eq('entrepreneur_id', entrepreneurId)

  if (error) throw new Error(`Error al cambiar membresía: ${error.message}`)
}

// ---------------------------------------------------------------------------
// activateMembership (new — needed by applications.service)
// ---------------------------------------------------------------------------

export async function activateMembership(
  entrepreneurId: string,
  applicationId: string,
  durationDays: number
): Promise<void> {
  const now = new Date().toISOString()
  const d = new Date()
  d.setDate(d.getDate() + durationDays)
  const endAt = d.toISOString()

  const { error: memError } = await supabaseAdmin
    .from('memberships')
    .update({ status: 'active', start_at: now, end_at: endAt, last_application_id: applicationId })
    .eq('entrepreneur_id', entrepreneurId)

  if (memError) throw new Error(`Error al activar membresía: ${memError.message}`)

  const { data: appRow, error: readError } = await supabaseAdmin
    .from('applications')
    .select('amount_cop')
    .eq('id', applicationId)
    .single<{ amount_cop: number }>()

  if (readError) throw new Error(readError.message)

  const { error: periodError } = await supabaseAdmin
    .from('membership_periods')
    .insert({
      entrepreneur_id: entrepreneurId,
      application_id: applicationId,
      start_at: now,
      end_at: endAt,
      amount_cop: appRow.amount_cop,
      paid_at: now,
    })

  if (periodError) throw new Error(`Error al registrar período: ${periodError.message}`)
}
