import { supabaseAdmin } from '@src/shared/lib/supabase-admin'
import type { ApplicationEditorialStatus } from '@src/features/profile-editorial-review/types'

export async function checkDuplicate(cedula: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('entrepreneurs')
    .select('id')
    .eq('cedula', cedula)
    .maybeSingle()

  if (error) throw new Error(`Error al verificar cédula duplicada: ${error.message}`)
  return data !== null
}

export async function getProduct(
  productId: string
): Promise<{ id: string; price_cop: number; duration_days: number | null } | null> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, price_cop, duration_days')
    .eq('id', productId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw new Error(`Error al obtener producto: ${error.message}`)
  return data
}

type CreateAllParams = {
  entrepreneurId: string
  cedula: string
  full_name: string
  email: string
  phone: string
  fb_profile_url: string
  business_name: string
  description: string
  category: string
  business_phone: string
  instagram_handle: string | null
  website_url: string | null
  other_socials: string | null
  offers_discount: boolean
  discount_details: string | null
  product_id: string
  amount_cop: number
  receipt_path: string | null
  post_screenshot_path: string | null
  description_editorial_status: ApplicationEditorialStatus
  description_review_id: string | null
  description_reviewed: boolean
  wompi_reference: string | null
  wompi_status: string | null
  payment_completed_at: string | null
}

export async function createAll(params: CreateAllParams): Promise<string> {
  const {
    entrepreneurId,
    cedula, full_name, email, phone, fb_profile_url,
    business_name, description, category, business_phone,
    instagram_handle, website_url, other_socials, offers_discount, discount_details,
    product_id, amount_cop, receipt_path, post_screenshot_path,
    description_editorial_status, description_review_id, description_reviewed,
    wompi_reference, wompi_status, payment_completed_at,
  } = params

  // a) entrepreneurs
  const { error: errEnt } = await supabaseAdmin.from('entrepreneurs').insert({
    id: entrepreneurId,
    cedula, full_name, email, phone, fb_profile_url,
    consent_accepted: true,
    consent_accepted_at: new Date().toISOString(),
  })
  if (errEnt) throw new Error(`Error al insertar emprendedora: ${errEnt.message}`)

  // b) business_profiles
  const profileInsert: Record<string, unknown> = {
    entrepreneur_id: entrepreneurId,
    business_name, description, category, business_phone,
    offers_discount, wants_directory: true, directory_image_path: null,
    stats_token: crypto.randomUUID(), // token único para la página privada de estadísticas
  }
  if (instagram_handle) profileInsert.instagram_handle = instagram_handle
  if (website_url) profileInsert.website_url = website_url
  if (other_socials) profileInsert.other_socials = other_socials
  if (discount_details) profileInsert.discount_details = discount_details

  let { error: errProfile } = await supabaseAdmin.from('business_profiles').insert(profileInsert)

  // Compatibilidad con esquemas antiguos que aún no tienen la columna stats_token
  if (errProfile?.message?.includes("stats_token")) {
    const fallbackInsert = { ...profileInsert }
    delete fallbackInsert.stats_token
    const fallbackResult = await supabaseAdmin.from('business_profiles').insert(fallbackInsert)
    errProfile = fallbackResult.error
  }

  if (errProfile) {
    await supabaseAdmin.from('entrepreneurs').delete().eq('id', entrepreneurId)
    throw new Error(`Error al insertar perfil: ${errProfile.message}`)
  }

  // c) applications
  const applicationInsertFull = {
    entrepreneur_id: entrepreneurId,
    product_id,
    status: 'pendiente',
    amount_cop,
    receipt_path: receipt_path ?? '',
    post_screenshot_path,
    description_editorial_status,
    description_review_id,
    description_reviewed,
    wompi_reference,
    wompi_status,
    payment_completed_at,
  }

  const applicationInsertBase = {
    entrepreneur_id: entrepreneurId,
    product_id,
    status: 'pendiente',
    amount_cop,
    receipt_path: receipt_path ?? '',
    post_screenshot_path,
  }

  let { data: application, error: errApp } = await supabaseAdmin
    .from('applications')
    .insert(applicationInsertFull)
    .select('id')
    .single()

  // Compatibilidad con esquemas antiguos que no tienen columnas opcionales nuevas
  if (errApp?.message?.includes('Could not find the') || errApp?.message?.includes('schema cache')) {
    const fallbackResult = await supabaseAdmin
      .from('applications')
      .insert(applicationInsertBase)
      .select('id')
      .single()
    application = fallbackResult.data
    errApp = fallbackResult.error
  }

  if (errApp || !application) {
    await supabaseAdmin.from('business_profiles').delete().eq('entrepreneur_id', entrepreneurId)
    await supabaseAdmin.from('entrepreneurs').delete().eq('id', entrepreneurId)
    throw new Error(`Error al insertar solicitud: ${errApp?.message}`)
  }

  const applicationId = application.id as string

  // d) profile_reviews
  const { error: errReview } = await supabaseAdmin
    .from('profile_reviews')
    .insert({ entrepreneur_id: entrepreneurId, status: 'pendiente' })

  if (errReview) {
    await supabaseAdmin.from('applications').delete().eq('id', applicationId)
    await supabaseAdmin.from('business_profiles').delete().eq('entrepreneur_id', entrepreneurId)
    await supabaseAdmin.from('entrepreneurs').delete().eq('id', entrepreneurId)
    throw new Error(`Error al insertar revisión: ${errReview.message}`)
  }

  // e) memberships
  const { error: errMem } = await supabaseAdmin
    .from('memberships')
    .insert({ entrepreneur_id: entrepreneurId, status: 'inactive', last_application_id: applicationId })

  if (errMem) {
    await supabaseAdmin.from('profile_reviews').delete().eq('entrepreneur_id', entrepreneurId)
    await supabaseAdmin.from('applications').delete().eq('id', applicationId)
    await supabaseAdmin.from('business_profiles').delete().eq('entrepreneur_id', entrepreneurId)
    await supabaseAdmin.from('entrepreneurs').delete().eq('id', entrepreneurId)
    throw new Error(`Error al crear membresía: ${errMem.message}`)
  }

  return applicationId
}

export async function createPaymentTransaction(params: {
  application_id: string
  entrepreneur_id: string
  product_id: string
  provider: string
  provider_reference: string
  amount_cop: number
  checkout_url?: string | null
  currency?: string
}): Promise<string> {
  const { application_id, entrepreneur_id, product_id, provider, provider_reference, amount_cop, checkout_url, currency } = params
  const { data, error } = await supabaseAdmin.from('payment_transactions').insert({
    application_id,
    entrepreneur_id,
    product_id,
    provider,
    provider_reference,
    amount_cop,
    currency: currency ?? 'COP',
    checkout_url: checkout_url ?? null,
    status: 'pending',
  }).select('id').single()

  if (error || !data) throw new Error(`Error al crear payment_transaction: ${error?.message}`)
  return data.id as string
}
