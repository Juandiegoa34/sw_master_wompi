'use client'

import { useState } from 'react'
import type { AIEditorialStatus, ReviewResult } from '../types'

export type AcceptedReview = {
  reviewId: string
  acceptedText: string
  seoTags: string[]
  searchKeywords: string[]
  seoDescription: string
  aiSummary: string
  editorialStatus: AIEditorialStatus
}

type Props = {
  description: string
  source?: 'user_form' | 'admin_panel'
  expandDetails?: boolean
  onResult?: (result: ReviewResult) => void
  onAccept: (result: AcceptedReview) => void
  onDismiss?: () => void
}

type PanelState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'result'; result: ReviewResult }
  | { phase: 'accepted' }
  | { phase: 'error'; message: string }
  | { phase: 'exhausted' }

const MAX_ATTEMPTS = 3

export function DescriptionReviewPanel({
  description,
  source = 'user_form',
  expandDetails = false,
  onResult,
  onAccept,
  onDismiss,
}: Props) {
  const [state, setState] = useState<PanelState>({ phase: 'idle' })
  const [attempts, setAttempts] = useState(0)
  const [editedText, setEditedText] = useState('')
  const [showDetails, setShowDetails] = useState(expandDetails)

  const attemptsLeft = MAX_ATTEMPTS - attempts
  const descriptionTooShort = description.trim().length < 10

  async function handleReview() {
    if (descriptionTooShort || attemptsLeft <= 0) return

    setState({ phase: 'loading' })

    try {
      const res = await fetch('/api/profiles/review-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim(), source }),
      })

      const json = await res.json() as {
        success: boolean
        message?: string
        reviewId?: string
        suggestedText?: string
        seoTags?: string[]
        searchKeywords?: string[]
        seoDescription?: string
        aiSummary?: string
        editorialStatus?: AIEditorialStatus
      }

      const nextAttempts = attempts + 1
      setAttempts(nextAttempts)

      if (!json.success) {
        if (res.status === 429 || nextAttempts >= MAX_ATTEMPTS) {
          setState({ phase: 'exhausted' })
        } else {
          setState({ phase: 'error', message: json.message ?? 'Error inesperado.' })
        }
        return
      }

      if (!json.reviewId || !json.suggestedText) {
        setState({ phase: 'error', message: 'Respuesta incompleta del servidor.' })
        return
      }

      const result: ReviewResult = {
        reviewId:        json.reviewId,
        suggestedText:   json.suggestedText,
        seoTags:         json.seoTags ?? [],
        searchKeywords:  json.searchKeywords ?? [],
        seoDescription:  json.seoDescription ?? '',
        aiSummary:       json.aiSummary ?? '',
        editorialStatus: json.editorialStatus ?? 'requiere_revision',
      }

      setEditedText(result.suggestedText)
      setState({ phase: 'result', result })
      onResult?.(result)
    } catch {
      setState({ phase: 'error', message: 'Error de conexión. Intenta de nuevo.' })
    }
  }

  function handleAccept() {
    if (state.phase !== 'result') return
    onAccept({
      reviewId:       state.result.reviewId,
      acceptedText:   editedText,
      seoTags:        state.result.seoTags,
      searchKeywords: state.result.searchKeywords,
      seoDescription: state.result.seoDescription,
      aiSummary:      state.result.aiSummary,
      editorialStatus: state.result.editorialStatus,
    })
    setState({ phase: 'accepted' })
  }

  function handleDismiss() {
    onDismiss?.()
    setState({ phase: 'idle' })
  }

  return (
    <div
      className="rounded-xl border p-4 space-y-3 text-sm"
      style={{ background: 'var(--sw-blush-mist)', borderColor: 'var(--sw-rose-pale)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[--fg]">Revisión editorial con IA</p>
          <p className="text-xs text-[--fg-3] mt-0.5">
            Opcional · {attemptsLeft} intento{attemptsLeft !== 1 ? 's' : ''} disponible{attemptsLeft !== 1 ? 's' : ''}
          </p>
        </div>

        {state.phase === 'idle' && (
          <button
            type="button"
            onClick={handleReview}
            disabled={descriptionTooShort || attemptsLeft <= 0}
            className="shrink-0 px-4 py-1.5 rounded-lg text-xs font-semibold text-sw-cream transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--accent)' }}
          >
            Revisar descripción
          </button>
        )}
      </div>

      {/* Loading */}
      {state.phase === 'loading' && (
        <p className="text-xs text-[--fg-2] animate-pulse">Analizando tu descripción…</p>
      )}

      {/* Error */}
      {state.phase === 'error' && (
        <div className="space-y-2">
          <p className="text-xs text-sw-burgundy">{state.message}</p>
          {attemptsLeft > 0 && (
            <button
              type="button"
              onClick={handleReview}
              className="text-xs font-medium text-[--accent] hover:underline"
            >
              Intentar de nuevo ({attemptsLeft} restante{attemptsLeft !== 1 ? 's' : ''})
            </button>
          )}
        </div>
      )}

      {/* Exhausted */}
      {state.phase === 'exhausted' && (
        <p className="text-xs text-[--fg-2]">
          Alcanzaste el máximo de {MAX_ATTEMPTS} revisiones. Puedes continuar con tu descripción actual.
        </p>
      )}

      {/* Result */}
      {state.phase === 'result' && (
        <div className="space-y-3">
          {/* Editable suggestion */}
          <div>
            <p className="text-xs font-medium text-[--fg-2] mb-1">Descripción sugerida (puedes editarla):</p>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={4}
              maxLength={300}
              className="w-full rounded-lg border px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 transition-all"
              style={{
                background: 'var(--sw-paper)',
                borderColor: 'var(--sw-line-strong)',
                color: 'var(--fg)',
              }}
            />
            <p className="text-xs text-[--fg-3] text-right mt-0.5">{editedText.length} / 300</p>
          </div>

          {/* SEO tags */}
          {state.result.seoTags.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[--fg-2] mb-1.5">Tags SEO sugeridos:</p>
              <div className="flex flex-wrap gap-1.5">
                {state.result.seoTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full text-xs font-medium border"
                    style={{
                      background: 'var(--sw-paper)',
                      borderColor: 'var(--sw-line-strong)',
                      color: 'var(--fg-2)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Search keywords */}
          {state.result.searchKeywords.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[--fg-2] mb-1">Keywords de búsqueda:</p>
              <p className="text-xs text-[--fg-3]">
                {state.result.searchKeywords.join(' · ')}
              </p>
            </div>
          )}

          {/* Collapsible SEO/AI details */}
          <div>
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="text-xs text-[--fg-3] hover:text-[--fg-2] transition-colors flex items-center gap-1"
            >
              <span>{showDetails ? '▲' : '▼'}</span>
              <span>{showDetails ? 'Ocultar' : 'Ver'} texto para Google e IA</span>
            </button>

            {showDetails && (
              <div className="mt-2 space-y-2 pl-2 border-l-2" style={{ borderColor: 'var(--sw-rose-pale)' }}>
                {state.result.seoDescription && (
                  <div>
                    <p className="text-xs font-medium text-[--fg-3]">Para Google (snippet):</p>
                    <p className="text-xs text-[--fg-2] mt-0.5">{state.result.seoDescription}</p>
                  </div>
                )}
                {state.result.aiSummary && (
                  <div>
                    <p className="text-xs font-medium text-[--fg-3]">Para sistemas de IA:</p>
                    <p className="text-xs text-[--fg-2] mt-0.5">{state.result.aiSummary}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleAccept}
              disabled={editedText.trim().length < 10}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-sw-cream hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--accent)' }}
            >
              Usar esta versión
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="px-4 py-1.5 rounded-lg text-xs font-medium text-[--fg-3] hover:text-[--fg] transition-colors"
            >
              Mantener la mía
            </button>
          </div>

          {attemptsLeft > 0 && (
            <p className="text-xs text-[--fg-3]">
              ¿No te convence? Puedes revisar {attemptsLeft} vez más.
            </p>
          )}
        </div>
      )}

      {/* Accepted */}
      {state.phase === 'accepted' && (
        <p className="text-xs text-[--fg-2]">
          Descripción actualizada. Puedes seguir editándola en el campo de arriba.
        </p>
      )}
    </div>
  )
}
