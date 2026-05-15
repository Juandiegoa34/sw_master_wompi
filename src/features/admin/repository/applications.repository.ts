import { supabaseAdmin } from '@src/shared/lib/supabase-admin'
import type { AdminApplication, ExistingReview } from '../types'
import type { ApplicationEditorialStatus } from '@src/features/profile-editorial-review/types'

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

type RawEntrepreneur = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  cedula: string
  fb_profile_url: string | null
}

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
  seo_tags: string[] | null
  search_keywords: string[] | null
  seo_description: string | null
  ai_summary: string | null
}

type RawProduct = {
  id: string
  name: string
  price_cop: number
  duration_days: number | null
}

type RawApplication = {
  id: string
  status: 'pendiente' | 'aprobado' | 'rechazado'
  amount_cop: number
  submitted_at: string
  reviewed_at: string | null
  notes: string | null
  receipt_path: string | null
  post_screenshot_path: string | null
  entrepreneur_id: string
  description_editorial_status: ApplicationEditorialStatus | null
  description_reviewed: boolean | null
  description_review_id: string | null
  wompi_reference: string | null
  wompi_status: string | null
  payment_completed_at: string | null
  entrepreneurs: RawEntrepreneur | RawEntrepreneur[] | null
  products: RawProduct | RawProduct[] | null
}

// ---------------------------------------------------------------------------
// listApplications (was: getAdminApplications)
// ---------------------------------------------------------------------------

export async function listApplications(
  status?: 'pendiente' | 'aprobado' | 'rechazado'
): Promise<AdminApplication[]> {
  let query = supabaseAdmin
    .from('applications')
    .select(`
      id, status, amount_cop, submitted_at, reviewed_at, notes,
      receipt_path, post_screenshot_path, entrepreneur_id,
      description_editorial_status, description_reviewed, description_review_id,
      wompi_reference, wompi_status, payment_completed_at,
      entrepreneurs (
        id, full_name, email, phone, cedula, fb_profile_url
      ),
      products ( id, name, price_cop, duration_days )
    `)
    .order('submitted_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data: apps, error } = await query.returns<RawApplication[]>()
  if (error) throw new Error(error.message)
  if (!apps || apps.length === 0) return []

  const entrepreneurIds = apps.map((a) => a.entrepreneur_id)
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('business_profiles')
    .select(`
      id, entrepreneur_id, business_name, category, description,
      business_phone, instagram_handle, website_url,
      directory_image_path, offers_discount, discount_details,
      seo_tags, search_keywords, seo_description, ai_summary
    `)
    .in('entrepreneur_id', entrepreneurIds)
    .returns<(RawBusinessProfile & { entrepreneur_id: string })[]>()

  if (profilesError) throw new Error(profilesError.message)

  const profileMap = new Map<string, RawBusinessProfile>()
  for (const p of profiles ?? []) {
    profileMap.set(p.entrepreneur_id, p)
  }

  return apps.map((app): AdminApplication => {
    const entrepreneur = one(app.entrepreneurs)
    const product = one(app.products)
    const bp = profileMap.get(app.entrepreneur_id)

    if (!entrepreneur) throw new Error(`Entrepreneur missing for application ${app.id}`)
    if (!product) throw new Error(`Product missing for application ${app.id}`)

    return {
      id: app.id,
      status: app.status,
      amount_cop: app.amount_cop,
      submitted_at: app.submitted_at,
      reviewed_at: app.reviewed_at,
      notes: app.notes,
      receipt_path: app.receipt_path,
      post_screenshot_path: app.post_screenshot_path,
      description_editorial_status: app.description_editorial_status ?? null,
      description_reviewed: app.description_reviewed ?? false,
      description_review_id: app.description_review_id ?? null,
      existing_review: null,
      wompi_reference: app.wompi_reference ?? null,
      wompi_status: app.wompi_status ?? null,
      payment_completed_at: app.payment_completed_at ?? null,
      entrepreneur: {
        id: entrepreneur.id,
        full_name: entrepreneur.full_name,
        email: entrepreneur.email,
        phone: entrepreneur.phone,
        cedula: entrepreneur.cedula,
        fb_profile_url: entrepreneur.fb_profile_url,
      },
      business_profile: {
        id: bp?.id ?? '',
        business_name: bp?.business_name ?? null,
        category: bp?.category ?? null,
        description: bp?.description ?? null,
        business_phone: bp?.business_phone ?? null,
        instagram_handle: bp?.instagram_handle ?? null,
        website_url: bp?.website_url ?? null,
        directory_image_path: bp?.directory_image_path ?? null,
        offers_discount: bp?.offers_discount ?? false,
        discount_details: bp?.discount_details ?? null,
        seo_tags: bp?.seo_tags ?? [],
        search_keywords: bp?.search_keywords ?? [],
        seo_description: bp?.seo_description ?? null,
        ai_summary: bp?.ai_summary ?? null,
      },
      product: {
        id: product.id,
        name: product.name,
        price_cop: product.price_cop,
        duration_days: product.duration_days,
      },
    }
  })
}

// ---------------------------------------------------------------------------
// getApplicationById (was: getAdminApplicationById)
// ---------------------------------------------------------------------------

export async function getApplicationById(id: string): Promise<AdminApplication | null> {
  const { data: app, error } = await supabaseAdmin
    .from('applications')
    .select(`
      id, status, amount_cop, submitted_at, reviewed_at, notes,
      receipt_path, post_screenshot_path, entrepreneur_id,
      description_editorial_status, description_reviewed, description_review_id,
      wompi_reference, wompi_status, payment_completed_at,
      entrepreneurs (
        id, full_name, email, phone, cedula, fb_profile_url
      ),
      products ( id, name, price_cop, duration_days )
    `)
    .eq('id', id)
    .single<RawApplication>()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  if (!app) return null

  const { data: bp, error: bpError } = await supabaseAdmin
    .from('business_profiles')
    .select(`
      id, business_name, category, description, business_phone,
      instagram_handle, website_url, directory_image_path,
      offers_discount, discount_details,
      seo_tags, search_keywords, seo_description, ai_summary
    `)
    .eq('entrepreneur_id', app.entrepreneur_id)
    .single<RawBusinessProfile>()

  if (bpError && bpError.code !== 'PGRST116') throw new Error(bpError.message)

  const entrepreneur = one(app.entrepreneurs)
  const product = one(app.products)

  if (!entrepreneur) throw new Error(`Entrepreneur missing for application ${app.id}`)
  if (!product) throw new Error(`Product missing for application ${app.id}`)

  // Third query: fetch review assets if a review_id is present
  let existingReview: ExistingReview | null = null
  if (app.description_review_id) {
    const { data: review } = await supabaseAdmin
      .from('profile_description_reviews')
      .select('suggested_text, seo_tags, search_keywords, seo_description, ai_summary')
      .eq('id', app.description_review_id)
      .maybeSingle()

    if (review) {
      existingReview = {
        suggested_text: review.suggested_text as string | null,
        seo_tags: (review.seo_tags as string[]) ?? [],
        search_keywords: (review.search_keywords as string[]) ?? [],
        seo_description: review.seo_description as string | null,
        ai_summary: review.ai_summary as string | null,
      }
    }
  }

  return {
    id: app.id,
    status: app.status,
    amount_cop: app.amount_cop,
    submitted_at: app.submitted_at,
    reviewed_at: app.reviewed_at,
    notes: app.notes,
    receipt_path: app.receipt_path,
    post_screenshot_path: app.post_screenshot_path,
    description_editorial_status: app.description_editorial_status ?? null,
    description_reviewed: app.description_reviewed ?? false,
    description_review_id: app.description_review_id ?? null,
    existing_review: existingReview,
    wompi_reference: app.wompi_reference ?? null,
    wompi_status: app.wompi_status ?? null,
    payment_completed_at: app.payment_completed_at ?? null,
    entrepreneur: {
      id: entrepreneur.id,
      full_name: entrepreneur.full_name,
      email: entrepreneur.email,
      phone: entrepreneur.phone,
      cedula: entrepreneur.cedula,
      fb_profile_url: entrepreneur.fb_profile_url,
    },
    business_profile: {
      id: bp?.id ?? '',
      business_name: bp?.business_name ?? null,
      category: bp?.category ?? null,
      description: bp?.description ?? null,
      business_phone: bp?.business_phone ?? null,
      instagram_handle: bp?.instagram_handle ?? null,
      website_url: bp?.website_url ?? null,
      directory_image_path: bp?.directory_image_path ?? null,
      offers_discount: bp?.offers_discount ?? false,
      discount_details: bp?.discount_details ?? null,
      seo_tags: bp?.seo_tags ?? [],
      search_keywords: bp?.search_keywords ?? [],
      seo_description: bp?.seo_description ?? null,
      ai_summary: bp?.ai_summary ?? null,
    },
    product: {
      id: product.id,
      name: product.name,
      price_cop: product.price_cop,
      duration_days: product.duration_days,
    },
  }
}

// ---------------------------------------------------------------------------
// approveApplication
// ---------------------------------------------------------------------------

export async function approveApplication(
  applicationId: string,
  _entrepreneurId: string,
  _durationDays: number
): Promise<void> {
  const now = new Date().toISOString()

  const { error: appError } = await supabaseAdmin
    .from('applications')
    .update({ status: 'aprobado', reviewed_at: now })
    .eq('id', applicationId)

  if (appError) throw new Error(`Error al aprobar solicitud: ${appError.message}`)
}

// ---------------------------------------------------------------------------
// rejectApplication
// ---------------------------------------------------------------------------

export async function rejectApplication(
  applicationId: string,
  notes?: string
): Promise<void> {
  const now = new Date().toISOString()

  const { data: appRow, error: readError } = await supabaseAdmin
    .from('applications')
    .select('entrepreneur_id')
    .eq('id', applicationId)
    .single<{ entrepreneur_id: string }>()

  if (readError) throw new Error(readError.message)

  const appUpdate: Record<string, unknown> = { status: 'rechazado', reviewed_at: now }
  if (notes !== undefined) appUpdate.notes = notes

  const { error: appError } = await supabaseAdmin
    .from('applications')
    .update(appUpdate)
    .eq('id', applicationId)

  if (appError) throw new Error(`Error al rechazar solicitud: ${appError.message}`)

  const { error: memError } = await supabaseAdmin
    .from('memberships')
    .update({ status: 'inactive' })
    .eq('entrepreneur_id', appRow.entrepreneur_id)

  if (memError) throw new Error(`Error al desactivar membresía: ${memError.message}`)
}

// ---------------------------------------------------------------------------
// applyApprovedDescription
// ---------------------------------------------------------------------------

type ReviewAssets = {
  seoTags: string[]
  searchKeywords: string[]
  seoDescription: string | null
  aiSummary: string | null
}

type ApplyDescriptionParams = {
  applicationId: string
  description: string
  reviewAssets: ReviewAssets | null
}

export async function applyApprovedDescription(params: ApplyDescriptionParams): Promise<void> {
  const { applicationId, description, reviewAssets } = params

  // Resolve entrepreneur_id server-side from applicationId — never trust client input
  const { data: appRow, error: readError } = await supabaseAdmin
    .from('applications')
    .select('entrepreneur_id')
    .eq('id', applicationId)
    .single<{ entrepreneur_id: string }>()

  if (readError || !appRow) throw new Error(`Solicitud no encontrada: ${readError?.message ?? 'sin datos'}`)

  const entrepreneurId = appRow.entrepreneur_id

  // 1. Update business_profiles.description (always) + SEO fields (only if verified assets)
  const profileUpdate: Record<string, unknown> = { description }
  if (reviewAssets) {
    profileUpdate.seo_tags        = reviewAssets.seoTags
    profileUpdate.search_keywords = reviewAssets.searchKeywords
    profileUpdate.seo_description = reviewAssets.seoDescription
    profileUpdate.ai_summary      = reviewAssets.aiSummary
  }

  const { error: bpError } = await supabaseAdmin
    .from('business_profiles')
    .update(profileUpdate)
    .eq('entrepreneur_id', entrepreneurId)

  if (bpError) throw new Error(`Error al actualizar perfil: ${bpError.message}`)

  // 2. Update applications: mark as admin_aprobada + description_reviewed = true
  const { error: appError } = await supabaseAdmin
    .from('applications')
    .update({ description_editorial_status: 'admin_aprobada', description_reviewed: true })
    .eq('id', applicationId)

  if (appError) throw new Error(`Error al actualizar solicitud: ${appError.message}`)
}
