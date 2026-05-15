import { NextRequest, NextResponse } from 'next/server'
import { enrollmentService } from '@src/features/enrollment/services/enrollment.service'
import { enrollmentSchema } from '@src/features/enrollment/validators'
import type { SubmissionResult } from '@src/features/enrollment/types'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest): Promise<NextResponse<SubmissionResult>> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  const allowed = await checkRateLimit(`enrollment:${ip}`, 3, 3600)
  if (!allowed) {
    return NextResponse.json(
      { success: false, message: 'Demasiados envíos. Espera una hora e intenta de nuevo.' },
      { status: 429 },
    )
  }
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ success: false, message: 'No se pudo leer el formulario.' }, { status: 400 })
  }

  // Normalize instagram_handle before validation
  const rawInstagram = (formData.get('instagram_handle') as string | null) ?? ''
  const normalizedInstagram = rawInstagram
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
    .replace(/^@/, '')
    .replace(/\/$/, '')

  const parsed = enrollmentSchema.safeParse({
    cedula:           formData.get('cedula'),
    full_name:        formData.get('full_name'),
    email:            formData.get('email'),
    phone:            formData.get('phone'),
    fb_profile_url:   formData.get('fb_profile_url'),
    business_name:    formData.get('business_name'),
    category:         formData.get('category'),
    description:      formData.get('description'),
    business_phone:   formData.get('business_phone'),
    instagram_handle: normalizedInstagram || undefined,
    website_url:      formData.get('website_url') || '',
    other_socials:    formData.get('other_socials') || '',
    offers_discount:  formData.get('offers_discount') === 'true',
    discount_details: formData.get('discount_details') || '',
    product_id:       formData.get('product_id'),
    consent_accepted: formData.get('consent_accepted') === 'true',
  })

  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 })
  }

  // File validation
  const MAX_FILE_SIZE = 5 * 1024 * 1024
  const ALLOWED_RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

  const receiptFile = formData.get('receipt')
  if (receiptFile instanceof File && receiptFile.size > 0) {
    if (!ALLOWED_RECEIPT_TYPES.includes(receiptFile.type)) {
      return NextResponse.json({ success: false, message: 'El comprobante debe ser JPG, PNG, WebP o PDF.' }, { status: 400 })
    }
    if (receiptFile.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, message: 'El comprobante no puede superar los 5 MB.' }, { status: 400 })
    }
  }

  const screenshotFile = formData.get('post_screenshot')

  const rawEditorialStatus = (formData.get('description_editorial_status') as string | null) ?? ''
  const rawReviewId        = (formData.get('description_review_id') as string | null) ?? ''

  const wompiReference = (formData.get('wompi_reference') as string | null) ?? null
  const wompiStatus = (formData.get('wompi_status') as string | null) ?? null
  const paymentCompletedAt = (formData.get('payment_completed_at') as string | null) ?? null

  const result = await enrollmentService.submit({
    cedula:                      String(formData.get('cedula')).trim(),
    full_name:                   String(formData.get('full_name')).trim(),
    email:                       String(formData.get('email')).trim(),
    phone:                       String(formData.get('phone')).trim(),
    fb_profile_url:              String(formData.get('fb_profile_url')).trim(),
    business_name:               String(formData.get('business_name')).trim(),
    description:                 String(formData.get('description')).trim(),
    category:                    String(formData.get('category')).trim(),
    business_phone:              String(formData.get('business_phone')).trim(),
    instagram_handle:            normalizedInstagram || null,
    website_url:                 formData.get('website_url') ? String(formData.get('website_url')).trim() || null : null,
    other_socials:               formData.get('other_socials') ? String(formData.get('other_socials')).trim() || null : null,
    discount_details:            formData.get('discount_details') ? String(formData.get('discount_details')).trim() || null : null,
    offers_discount:             String(formData.get('offers_discount')).trim() === 'true',
    product_id:                  String(formData.get('product_id')).trim(),
    receipt:                     receiptFile instanceof File ? receiptFile : null,
    post_screenshot:             screenshotFile instanceof File && (screenshotFile as File).size > 0 ? screenshotFile as File : null,
    description_editorial_status: rawEditorialStatus,
    description_review_id:        rawReviewId,
    wompi_reference:             wompiReference,
    wompi_status:                wompiStatus,
    payment_completed_at:        paymentCompletedAt,
  })

  const statusCode = result.success ? 200 : result.message.includes('cédula') ? 409 : 400
  return NextResponse.json(result, { status: statusCode })
}
