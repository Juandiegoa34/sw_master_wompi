import { callGeminiReview } from './provider'
import { countRecentReviews, saveReview } from './repository'
import type { ReviewRequest, ReviewResult } from './types'

const MAX_REVIEWS_PER_SESSION = 3
const PROVIDER = 'gemini'
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'

type ServiceResult =
  | { ok: true; data: ReviewResult }
  | { ok: false; status: 429 | 500; message: string }

async function hashText(text: string): Promise<string> {
  const encoded = new TextEncoder().encode(text)
  const buffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function requestReview(input: ReviewRequest): Promise<ServiceResult> {
  const count = await countRecentReviews(input.sessionKey)
  if (count >= MAX_REVIEWS_PER_SESSION) {
    return {
      ok: false,
      status: 429,
      message: `Alcanzaste el máximo de ${MAX_REVIEWS_PER_SESSION} revisiones. Puedes continuar con tu descripción actual.`,
    }
  }

  let geminiResult: Awaited<ReturnType<typeof callGeminiReview>>
  try {
    geminiResult = await callGeminiReview(input.description)
  } catch (err) {
    console.error('[editorial-review] Gemini error:', err)
    return {
      ok: false,
      status: 500,
      message: 'El servicio de revisión no está disponible en este momento. Puedes continuar sin revisión.',
    }
  }

  const inputHash = await hashText(input.description)

  let reviewId: string
  try {
    reviewId = await saveReview({
      sessionKey:      input.sessionKey,
      inputHash,
      suggestedText:   geminiResult.suggestedText,
      seoTags:         geminiResult.seoTags,
      searchKeywords:  geminiResult.searchKeywords,
      seoDescription:  geminiResult.seoDescription,
      aiSummary:       geminiResult.aiSummary,
      editorialStatus: geminiResult.editorialStatus,
      reviewSource:    input.source,
      provider:        PROVIDER,
      model:           MODEL,
    })
  } catch (err) {
    console.error('[editorial-review] Save error:', err)
    return {
      ok: false,
      status: 500,
      message: 'El servicio de revisión no está disponible en este momento. Puedes continuar sin revisión.',
    }
  }

  return {
    ok: true,
    data: {
      reviewId,
      suggestedText:   geminiResult.suggestedText,
      seoTags:         geminiResult.seoTags,
      searchKeywords:  geminiResult.searchKeywords,
      seoDescription:  geminiResult.seoDescription,
      aiSummary:       geminiResult.aiSummary,
      editorialStatus: geminiResult.editorialStatus,
    },
  }
}
