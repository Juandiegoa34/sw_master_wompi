import { supabaseAdmin } from '@src/shared/lib/supabase-admin'
import type { AdminProfile, UpdateProfileData } from '../types'

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/** Normaliza relaciones 1:1 que Supabase puede devolver como {} o [{}]. */
function one<T>(raw: T | T[] | null | undefined): T | null {
  if (raw === null || raw === undefined) return null
  return Array.isArray(raw) ? (raw[0] ?? null) : raw
}

// ---------------------------------------------------------------------------
// Tipos de fila crudos devueltos por Supabase
// ---------------------------------------------------------------------------

type RawBusinessProfile = {
  id: string
  business_name: string | null
  category: string | null
  description: string | null
  business_phone: string | null
  instagram_handle: string | null
  website_url: string | null
  directory_image_path: string | null
  offers_discount: boolean
  discount_details: string | null
  stats_token: string | null
}

type RawProfileRow = {
  id: string
  cedula: string
  full_name: string | null
  email: string | null
  phone: string | null
  fb_profile_url: string | null
  business_profiles: (RawBusinessProfile & { entrepreneur_id?: string }) | (RawBusinessProfile & { entrepreneur_id?: string })[] | null
  memberships: {
    status: 'active' | 'inactive'
    start_at: string | null
    end_at: string | null
  } | {
    status: 'active' | 'inactive'
    start_at: string | null
    end_at: string | null
  }[] | null
}

// ---------------------------------------------------------------------------
// Field sets for updateProfile
// ---------------------------------------------------------------------------

const ENTREPRENEUR_FIELDS = new Set([
  'full_name', 'email', 'phone', 'fb_profile_url',
])

const BUSINESS_PROFILE_FIELDS = new Set([
  'business_name', 'category', 'description', 'business_phone',
  'instagram_handle', 'website_url', 'other_socials',
  'directory_image_path', 'offers_discount', 'discount_details',
])

// ---------------------------------------------------------------------------
// getAdminProfiles
// ---------------------------------------------------------------------------

export async function getAdminProfiles(search?: string): Promise<AdminProfile[]> {
  let query = supabaseAdmin
    .from('entrepreneurs')
    .select(`
      id, cedula, full_name, email, phone, fb_profile_url,
      business_profiles ( id, business_name, category, description,
        business_phone, instagram_handle, website_url, other_socials,
        directory_image_path, offers_discount, discount_details, stats_token ),
      memberships ( status, start_at, end_at )
    `)
    .order('full_name', { ascending: true })

  if (search) {
    query = query.ilike('full_name', `%${search}%`)
  }

  const { data: rows, error } = await query.returns<RawProfileRow[]>()
  if (error) throw new Error(error.message)
  if (!rows || rows.length === 0) return []

  const entrepreneurIds = rows.map((r) => r.id)
  const { data: latestApps, error: appsError } = await supabaseAdmin
    .from('applications')
    .select('entrepreneur_id, status, submitted_at')
    .in('entrepreneur_id', entrepreneurIds)
    .order('submitted_at', { ascending: false })
    .returns<{ entrepreneur_id: string; status: 'pendiente' | 'aprobado' | 'rechazado'; submitted_at: string }[]>()

  if (appsError) throw new Error(appsError.message)

  const appStatusMap = new Map<string, 'pendiente' | 'aprobado' | 'rechazado'>()
  for (const a of latestApps ?? []) {
    if (!appStatusMap.has(a.entrepreneur_id)) {
      appStatusMap.set(a.entrepreneur_id, a.status)
    }
  }

  const filtered = search
    ? rows.filter((r) => {
        const bp = one(r.business_profiles)
        const nameMatch = r.full_name?.toLowerCase().includes(search.toLowerCase())
        const bizMatch = bp?.business_name?.toLowerCase().includes(search.toLowerCase())
        return nameMatch || bizMatch
      })
    : rows

  return filtered.map((r): AdminProfile => {
    const bp = one(r.business_profiles)
    const mem = one(r.memberships)

    return {
      entrepreneur_id: r.id,
      cedula: r.cedula,
      full_name: r.full_name,
      email: r.email,
      phone: r.phone,
      fb_profile_url: r.fb_profile_url,
      business_name: bp?.business_name ?? null,
      category: bp?.category ?? null,
      description: bp?.description ?? null,
      business_phone: bp?.business_phone ?? null,
      instagram_handle: bp?.instagram_handle ?? null,
      website_url: bp?.website_url ?? null,
      other_socials: (bp as (RawBusinessProfile & { other_socials?: string | null }) | null)?.other_socials ?? null,
      directory_image_path: bp?.directory_image_path ?? null,
      offers_discount: bp?.offers_discount ?? false,
      discount_details: bp?.discount_details ?? null,
      membership_status: mem?.status ?? null,
      membership_start: mem?.start_at ?? null,
      membership_end: mem?.end_at ?? null,
      application_status: appStatusMap.get(r.id) ?? null,
      stats_token: bp?.stats_token ?? null,
    }
  })
}

// ---------------------------------------------------------------------------
// getAdminProfileById
// ---------------------------------------------------------------------------

export async function getAdminProfileById(entrepreneurId: string): Promise<AdminProfile | null> {
  const { data: row, error } = await supabaseAdmin
    .from('entrepreneurs')
    .select(`
      id, cedula, full_name, email, phone, fb_profile_url,
      business_profiles ( id, business_name, category, description,
        business_phone, instagram_handle, website_url, other_socials,
        directory_image_path, offers_discount, discount_details, stats_token ),
      memberships ( status, start_at, end_at )
    `)
    .eq('id', entrepreneurId)
    .single<RawProfileRow>()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  if (!row) return null

  const { data: latestApp, error: appError } = await supabaseAdmin
    .from('applications')
    .select('status')
    .eq('entrepreneur_id', entrepreneurId)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .single<{ status: 'pendiente' | 'aprobado' | 'rechazado' }>()

  if (appError && appError.code !== 'PGRST116') throw new Error(appError.message)

  const bp = one(row.business_profiles)
  const mem = one(row.memberships)

  return {
    entrepreneur_id: row.id,
    cedula: row.cedula,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    fb_profile_url: row.fb_profile_url,
    business_name: bp?.business_name ?? null,
    category: bp?.category ?? null,
    description: bp?.description ?? null,
    business_phone: bp?.business_phone ?? null,
    instagram_handle: bp?.instagram_handle ?? null,
    website_url: bp?.website_url ?? null,
    other_socials: (bp as (RawBusinessProfile & { other_socials?: string | null }) | null)?.other_socials ?? null,
    directory_image_path: bp?.directory_image_path ?? null,
    offers_discount: bp?.offers_discount ?? false,
    discount_details: bp?.discount_details ?? null,
    membership_status: mem?.status ?? null,
    membership_start: mem?.start_at ?? null,
    membership_end: mem?.end_at ?? null,
    application_status: latestApp?.status ?? null,
    stats_token: bp?.stats_token ?? null,
  }
}

// ---------------------------------------------------------------------------
// updateProfile
// ---------------------------------------------------------------------------

export async function updateProfile(
  entrepreneurId: string,
  data: UpdateProfileData
): Promise<void> {
  const entrepreneurData: Record<string, unknown> = {}
  const businessData: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue
    if (ENTREPRENEUR_FIELDS.has(key)) {
      entrepreneurData[key] = value
    } else if (BUSINESS_PROFILE_FIELDS.has(key)) {
      businessData[key] = value
    }
  }

  if (Object.keys(entrepreneurData).length > 0) {
    const { error } = await supabaseAdmin
      .from('entrepreneurs')
      .update(entrepreneurData)
      .eq('id', entrepreneurId)

    if (error) throw new Error(`Error al actualizar emprendedora: ${error.message}`)
  }

  if (Object.keys(businessData).length > 0) {
    const { error } = await supabaseAdmin
      .from('business_profiles')
      .update(businessData)
      .eq('entrepreneur_id', entrepreneurId)

    if (error) throw new Error(`Error al actualizar perfil de negocio: ${error.message}`)
  }
}
