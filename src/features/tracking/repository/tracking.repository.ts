import { supabaseAdmin } from '@src/shared/lib/supabase-admin'
import type { ContactClickType, ProfileStats, TimeSeriesPoint, DirectoryAverages } from '../types'

export async function insertView(profileId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('profile_views')
    .insert({ profile_id: profileId, viewed_at: new Date().toISOString() })

  if (error) throw new Error(`Error al registrar vista: ${error.message}`)
}

export async function insertClick(profileId: string, type: ContactClickType): Promise<void> {
  const { error } = await supabaseAdmin
    .from('contact_clicks')
    .insert({ profile_id: profileId, click_type: type, clicked_at: new Date().toISOString() })

  if (error) throw new Error(`Error al registrar click: ${error.message}`)
}

export async function getStatsByToken(token: string): Promise<(ProfileStats & { businessName: string }) | null> {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('business_profiles')
    .select('id, business_name')
    .eq('stats_token', token)
    .maybeSingle()

  if (profileError) throw new Error(profileError.message)
  if (!profile) return null

  const profileId = profile.id as string
  const businessName = (profile.business_name as string | null) ?? ''

  const { count: views } = await supabaseAdmin
    .from('profile_views')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profileId)

  const { data: clicks } = await supabaseAdmin
    .from('contact_clicks')
    .select('click_type')
    .eq('profile_id', profileId)

  const clickCounts = { whatsapp: 0, instagram: 0, website: 0 }
  for (const c of clicks ?? []) {
    const t = c.click_type as ContactClickType
    if (t in clickCounts) clickCounts[t]++
  }

  return {
    profileId,
    businessName,
    views: views ?? 0,
    clicks: {
      ...clickCounts,
      total: clickCounts.whatsapp + clickCounts.instagram + clickCounts.website,
    },
  }
}

export async function getTimeSeriesStats(profileId: string): Promise<TimeSeriesPoint[]> {
  const since = new Date()
  since.setDate(since.getDate() - 29)
  const sinceIso = since.toISOString()

  const [{ data: viewRows, error: viewErr }, { data: clickRows, error: clickErr }] =
    await Promise.all([
      supabaseAdmin
        .from('profile_views')
        .select('viewed_at')
        .eq('profile_id', profileId)
        .gte('viewed_at', sinceIso),
      supabaseAdmin
        .from('contact_clicks')
        .select('clicked_at')
        .eq('profile_id', profileId)
        .gte('clicked_at', sinceIso),
    ])

  if (viewErr) throw new Error(`Error al obtener vistas: ${viewErr.message}`)
  if (clickErr) throw new Error(`Error al obtener clicks: ${clickErr.message}`)

  // Build a map of the last 30 days
  const map = new Map<string, { views: number; clicks: number }>()
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    map.set(key, { views: 0, clicks: 0 })
  }

  for (const row of viewRows ?? []) {
    const key = (row.viewed_at as string).slice(0, 10)
    const entry = map.get(key)
    if (entry) entry.views++
  }

  for (const row of clickRows ?? []) {
    const key = (row.clicked_at as string).slice(0, 10)
    const entry = map.get(key)
    if (entry) entry.clicks++
  }

  return Array.from(map.entries()).map(([date, counts]) => ({ date, ...counts }))
}

export async function getDirectoryAverages(): Promise<DirectoryAverages> {
  // Get business_profile IDs for active memberships
  const { data: activeMemberships, error: profErr } = await supabaseAdmin
    .from('memberships')
    .select('entrepreneur_id')
    .eq('status', 'active')

  if (profErr) throw new Error(`Error al obtener membresías activas: ${profErr.message}`)
  if (!activeMemberships || activeMemberships.length === 0) return { avgViews: 0, avgClicks: 0 }

  // Get business_profile IDs for those entrepreneurs
  const entrepreneurIds = activeMemberships.map((m) => m.entrepreneur_id as string)
  const { data: bps, error: bpErr } = await supabaseAdmin
    .from('business_profiles')
    .select('id')
    .in('entrepreneur_id', entrepreneurIds)

  if (bpErr) throw new Error(`Error al obtener perfiles activos: ${bpErr.message}`)
  const profileIds = (bps ?? []).map((bp) => bp.id as string)
  if (profileIds.length === 0) return { avgViews: 0, avgClicks: 0 }

  const [{ count: totalViews, error: vErr }, { count: totalClicks, error: cErr }] =
    await Promise.all([
      supabaseAdmin
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .in('profile_id', profileIds),
      supabaseAdmin
        .from('contact_clicks')
        .select('*', { count: 'exact', head: true })
        .in('profile_id', profileIds),
    ])

  if (vErr) throw new Error(`Error al contar vistas: ${vErr.message}`)
  if (cErr) throw new Error(`Error al contar clicks: ${cErr.message}`)

  return {
    avgViews: Math.round((totalViews ?? 0) / profileIds.length),
    avgClicks: Math.round((totalClicks ?? 0) / profileIds.length),
  }
}
