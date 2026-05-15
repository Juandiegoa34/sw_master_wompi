import { NextRequest, NextResponse } from 'next/server'
import { trackingService } from '@src/features/tracking/services/tracking.service'
import type { ContactClickType } from '@src/features/tracking/types'

const VALID_CLICK_TYPES: ContactClickType[] = ['whatsapp', 'instagram', 'website']
const VALID_TYPES = [...VALID_CLICK_TYPES, 'view'] as const

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: { profileId?: string; type?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { profileId, type } = body

  if (!profileId || !type) {
    return NextResponse.json({ error: 'profileId and type are required' }, { status: 400 })
  }

  if (!VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  if (type === 'view') {
    await trackingService.recordView(profileId)
  } else {
    await trackingService.recordClick(profileId, type as ContactClickType)
  }

  return new NextResponse(null, { status: 204 })
}
