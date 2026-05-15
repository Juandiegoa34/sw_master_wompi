export type ReviewSource = 'user_form' | 'admin_panel'

// Estado editorial que la IA emite sobre el texto revisado
export type AIEditorialStatus = 'aprobado' | 'requiere_revision' | 'incompleta'

// Estado de flujo editorial de la aplicación (para admin)
export type ApplicationEditorialStatus =
  | 'sin_revision'
  | 'ia_sugerida'
  | 'ia_aceptada'
  | 'requiere_revision_manual'
  | 'admin_aprobada'

export type ReviewRequest = {
  description: string
  sessionKey: string
  source: ReviewSource
}

export type ReviewResult = {
  reviewId: string
  suggestedText: string
  seoTags: string[]
  searchKeywords: string[]
  seoDescription: string
  aiSummary: string
  editorialStatus: AIEditorialStatus
}

export type ReviewRecord = {
  id: string
  sessionKey: string
  inputHash: string
  suggestedText: string | null
  seoTags: string[]
  searchKeywords: string[]
  seoDescription: string | null
  aiSummary: string | null
  editorialStatus: AIEditorialStatus | null
  reviewSource: ReviewSource
  provider: string
  model: string
  attempts: number
  accepted: boolean
  createdAt: string
  expiresAt: string
}
