import type { AIEditorialStatus } from './types'

type GeminiReviewResponse = {
  suggestedText: string
  seoTags: string[]
  searchKeywords: string[]
  seoDescription: string
  aiSummary: string
  editorialStatus: AIEditorialStatus
}

export async function callGeminiReview(description: string): Promise<GeminiReviewResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

  const prompt = `Eres un editor de contenido especializado en emprendimientos latinoamericanos.
Recibiste la siguiente descripción de un negocio escrita por su dueña:

"""
${description}
"""

Tu tarea es generar 6 salidas en español. Responde ÚNICAMENTE con JSON válido en este formato exacto, sin texto adicional:

{
  "suggestedText": "Descripción mejorada en 1-3 oraciones. Tono cálido y auténtico, sin jerga corporativa. Máximo 280 caracteres.",
  "seoTags": ["tag1", "tag2"],
  "searchKeywords": ["keyword1", "keyword2"],
  "seoDescription": "Frase corta optimizada para aparecer como snippet en Google. Máximo 160 caracteres.",
  "aiSummary": "Descripción densa en tercera persona que explique el negocio para que sistemas de IA lo entiendan bien. Incluye categoría, ubicación si aplica, propuesta de valor. Máximo 200 caracteres.",
  "editorialStatus": "aprobado"
}

Reglas:
- suggestedText: máximo 280 caracteres, en primera persona o directa
- seoTags: entre 2 y 5 etiquetas cortas en español (1-3 palabras cada una, sin #)
- searchKeywords: entre 3 y 8 palabras clave que alguien escribiría para encontrar este negocio
- seoDescription: máximo 160 caracteres
- aiSummary: máximo 200 caracteres
- editorialStatus: uno de estos tres valores exactos:
  - "aprobado" si el texto es claro, completo y bien describe el negocio
  - "requiere_revision" si el texto es vago, muy genérico o tiene problemas de claridad
  - "incompleta" si el texto es demasiado corto o fragmentado para entender el negocio`

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 768 },
  }

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${errorText}`)
  }

  const data = await res.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error(`Gemini returned non-JSON response: ${rawText.slice(0, 200)}`)
  }

  const p = parsed as Record<string, unknown>

  const suggestedText = typeof p.suggestedText === 'string' ? p.suggestedText.slice(0, 300) : ''
  if (!suggestedText) throw new Error('Gemini returned empty suggestedText')

  const seoTags = Array.isArray(p.seoTags)
    ? (p.seoTags as unknown[]).filter((t): t is string => typeof t === 'string').slice(0, 5)
    : []

  const searchKeywords = Array.isArray(p.searchKeywords)
    ? (p.searchKeywords as unknown[]).filter((t): t is string => typeof t === 'string').slice(0, 8)
    : []

  const seoDescription = typeof p.seoDescription === 'string' ? p.seoDescription.slice(0, 160) : ''
  const aiSummary = typeof p.aiSummary === 'string' ? p.aiSummary.slice(0, 200) : ''

  const validStatuses: AIEditorialStatus[] = ['aprobado', 'requiere_revision', 'incompleta']
  const editorialStatus: AIEditorialStatus =
    validStatuses.includes(p.editorialStatus as AIEditorialStatus)
      ? (p.editorialStatus as AIEditorialStatus)
      : 'requiere_revision'

  return { suggestedText, seoTags, searchKeywords, seoDescription, aiSummary, editorialStatus }
}
