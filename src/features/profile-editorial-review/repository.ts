import { supabaseAdmin } from '@src/shared/lib/supabase-admin'
import type { ReviewRecord, ReviewSource, AIEditorialStatus } from './types'

export async function countRecentReviews(sessionKey: string): Promise<number> {
  const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  const { count, error } = await supabaseAdmin
    .from('profile_description_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('session_key', sessionKey)
    .gte('created_at', since)

  if (error) throw new Error(`Error counting reviews: ${error.message}`)
  return count ?? 0
}

export async function saveReview(params: {
  sessionKey: string
  inputHash: string
  suggestedText: string
  seoTags: string[]
  searchKeywords: string[]
  seoDescription: string
  aiSummary: string
  editorialStatus: AIEditorialStatus
  reviewSource: ReviewSource
  provider: string
  model: string
}): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('profile_description_reviews')
    .insert({
      session_key:      params.sessionKey,
      input_hash:       params.inputHash,
      suggested_text:   params.suggestedText,
      seo_tags:         params.seoTags,
      search_keywords:  params.searchKeywords,
      seo_description:  params.seoDescription,
      ai_summary:       params.aiSummary,
      editorial_status: params.editorialStatus,
      review_source:    params.reviewSource,
      provider:         params.provider,
      model:            params.model,
    })
    .select('id')
    .single()

  if (error || !data) throw new Error(`Error saving review: ${error?.message}`)
  return data.id as string
}

export async function getReview(reviewId: string): Promise<ReviewRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('profile_description_reviews')
    .select('*')
    .eq('id', reviewId)
    .maybeSingle()

  if (error) throw new Error(`Error fetching review: ${error.message}`)
  if (!data) return null

  return {
    id:              data.id as string,
    sessionKey:      data.session_key as string,
    inputHash:       data.input_hash as string,
    suggestedText:   data.suggested_text as string | null,
    seoTags:         (data.seo_tags as string[]) ?? [],
    searchKeywords:  (data.search_keywords as string[]) ?? [],
    seoDescription:  data.seo_description as string | null,
    aiSummary:       data.ai_summary as string | null,
    editorialStatus: data.editorial_status as AIEditorialStatus | null,
    reviewSource:    data.review_source as ReviewSource,
    provider:        data.provider as string,
    model:           data.model as string,
    attempts:        data.attempts as number,
    accepted:        data.accepted as boolean,
    createdAt:       data.created_at as string,
    expiresAt:       data.expires_at as string,
  }
}

export async function markUsed(reviewId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('profile_description_reviews')
    .update({ accepted: true })
    .eq('id', reviewId)

  if (error) throw new Error(`Error marking review used: ${error.message}`)
}
