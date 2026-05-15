import { NextRequest, NextResponse } from 'next/server'
import { enrollmentService } from '@src/features/enrollment/services/enrollment.service'
import type { SubmissionResult } from '@src/features/enrollment/types'

export async function POST(request: NextRequest): Promise<NextResponse<SubmissionResult>> {
  try {
    const body = await request.json()

    // Expect minimal fields required to create pending application
    const result = await enrollmentService.createPending({
      cedula: String(body.cedula || ''),
      full_name: String(body.full_name || ''),
      email: String(body.email || ''),
      phone: String(body.phone || ''),
      fb_profile_url: String(body.fb_profile_url || ''),
      business_name: String(body.business_name || ''),
      description: String(body.description || ''),
      category: String(body.category || ''),
      business_phone: String(body.business_phone || ''),
      instagram_handle: body.instagram_handle ?? null,
      website_url: body.website_url ?? null,
      other_socials: body.other_socials ?? null,
      offers_discount: Boolean(body.offers_discount),
      discount_details: body.discount_details ?? null,
      product_id: String(body.product_id || ''),
      receipt: null,
      post_screenshot: null,
      description_editorial_status: body.description_editorial_status ?? undefined,
      description_review_id: body.description_review_id ?? undefined,
    })

    const status = result.success ? 200 : 400
    return NextResponse.json(result, { status })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al crear la aplicación.'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
