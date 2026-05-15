import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { slugify } from '@src/shared/utils/slugify'
import {
  classifyChatIntent,
  generateChatReply,
  generateGeneralReply,
  generateTextEmbedding,
  type SemanticBusinessMatch,
} from '@/lib/gemini'

const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(2000),
})

type QueryTopic = 'food' | 'tech' | 'fashion' | 'beauty' | 'home' | 'gift' | 'health' | 'education' | 'general'

const TOPIC_KEYWORDS: Record<Exclude<QueryTopic, 'general'>, string[]> = {
  food: ['alimentación', 'alimentacion', 'comida', 'comer', 'restaurante', 'gourmet', 'saludable', 'cocina', 'menú', 'menu', 'domicilio'],
  tech: ['tecnología', 'tecnologia', 'software', 'web', 'app', 'desarrollo', 'programacion', 'programación', 'digital'],
  fashion: ['moda y accesorios', 'moda', 'ropa', 'vestir', 'outfit', 'accesorios', 'joyeria', 'joyería'],
  beauty: ['belleza y cuidado personal', 'belleza', 'spa', 'maquillaje', 'uñas', 'unas', 'cuidado personal', 'estetica', 'estética'],
  home: ['hogar y decoración', 'hogar', 'casa', 'decoracion', 'decoración', 'muebles', 'arreglos', 'mantenimiento'],
  gift: ['regalo', 'regalos', 'detalle', 'obsequio', 'cumpleaños', 'cumpleanos', 'madre', 'amigo'],
  health: ['salud y bienestar', 'salud', 'bienestar', 'fitness', 'terapia', 'nutricion', 'nutrición', 'mente', 'serena'],
  education: ['educación y servicios', 'educacion', 'curso', 'capacitacion', 'capacitación', 'taller', 'asesoria', 'asesoría', 'mentor', 'formacion', 'formación'],
}

function detectQueryTopic(message: string): QueryTopic {
  const normalized = message.toLowerCase()

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS) as Array<[Exclude<QueryTopic, 'general'>, string[]]>) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return topic
    }
  }

  return 'general'
}

function getMatchSearchText(match: SemanticBusinessMatch): string {
  return [match.business_name, match.category, match.description, match.city, match.other_socials]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function getTopicKeywords(topic: Exclude<QueryTopic, 'general'>): string[] {
  return TOPIC_KEYWORDS[topic]
}

function filterMatchesByTopic(message: string, matches: SemanticBusinessMatch[]): SemanticBusinessMatch[] {
  const topic = detectQueryTopic(message)

  if (topic === 'general') {
    return matches
  }

  const keywords = getTopicKeywords(topic)
  const filtered = matches.filter((match) => {
    const haystack = getMatchSearchText(match)
    return keywords.some((keyword) => haystack.includes(keyword))
  })

  return filtered
}

function sortAndLimitMatches(matches: SemanticBusinessMatch[], limit: number): SemanticBusinessMatch[] {
  return [...matches]
    .sort((left, right) => (right.similarity ?? 0) - (left.similarity ?? 0))
    .slice(0, limit)
}

function parseRetrySeconds(message: string): number | null {
  const match = message.match(/retry in\s+([\d.]+)s/i)
  if (!match) return null

  const value = Number(match[1])
  return Number.isFinite(value) ? Math.ceil(value) : null
}

function isQuotaOrRateLimitError(message: string): boolean {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('quota') ||
    normalized.includes('rate') ||
    normalized.includes('429') ||
    normalized.includes('too many requests')
  )
}

function buildSearchFallbackReply(query: string, matches: SemanticBusinessMatch[]): string {
  const topMatches = matches.slice(0, 3)
  const lines = topMatches.map((match, index) => {
    const name = match.business_name ?? 'Negocio sin nombre'
    const category = match.category ?? 'Sin categoria'
    const city = match.city ?? 'Sin ciudad'
    const phone = match.business_phone ?? 'Sin telefono'
    const score = typeof match.similarity === 'number' ? `${Math.round(match.similarity * 100)}%` : 'N/A'
    return `${index + 1}. ${name} (${category}, ${city}) - ${phone} - Coincidencia ${score}`
  })

  return [
    `Encontre estas opciones relacionadas con: "${query}".`,
    ...lines,
    'Si quieres, puedo ayudarte a refinar la busqueda por ciudad, presupuesto o categoria.',
  ].join('\n')
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = chatRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid request body',
        details: parsed.error.flatten(),
      },
      { status: 400 }
    )
  }

  const message = parsed.data.message
  const intent = await classifyChatIntent(message)

  if (intent === 'general') {
    try {
      const reply = await generateGeneralReply({ message })
      return NextResponse.json({ reply, matches: [] })
    } catch (generalError) {
      const errorMsg = generalError instanceof Error ? generalError.message : 'Error desconocido'
      console.error('Error generating general chat reply:', errorMsg)
      const retrySeconds = parseRetrySeconds(errorMsg)
      if (isQuotaOrRateLimitError(errorMsg)) {
        return NextResponse.json({
          reply: retrySeconds
            ? `La IA esta temporalmente ocupada por limite de uso. Intenta nuevamente en aproximadamente ${retrySeconds} segundos.`
            : 'La IA esta temporalmente ocupada por limite de uso. Intenta nuevamente en unos segundos.',
          matches: [],
        })
      }

      return NextResponse.json({
        reply: 'Disculpa, no pude generar una respuesta de IA en este momento. Intenta nuevamente en unos segundos.',
        matches: [],
      })
    }
  }

  const embedding = await generateTextEmbedding(message)

  if (embedding.length === 0) {
    return NextResponse.json({ error: 'No se pudo generar el embedding' }, { status: 500 })
  }

  let matches: SemanticBusinessMatch[] = []
  const searchConfigs = [
    { similarity_threshold: 0.65, match_count: 3 },
    { similarity_threshold: 0.55, match_count: 4 },
  ] as const

  for (const config of searchConfigs) {
    const { data, error } = await supabaseAdmin.rpc('match_businesses_gemini', {
      query_embedding: embedding,
      similarity_threshold: config.similarity_threshold,
      match_count: config.match_count,
    })

    if (error) {
      return NextResponse.json(
        { error: `No se pudo consultar el buscador semantico: ${error.message}` },
        { status: 500 }
      )
    }

    matches = (data ?? []) as SemanticBusinessMatch[]

    if (matches.length > 0) {
      break
    }
  }

  matches = filterMatchesByTopic(message, matches)
  matches = sortAndLimitMatches(matches, 3)

  if (matches.length === 0) {
    return NextResponse.json({
      reply:
        'No encontre coincidencias realmente relacionadas en el directorio. Prueba con otro nombre, categoria, ciudad o tipo de negocio mas especifico.',
      matches: [],
    })
  }

  let reply: string
  try {
    reply = await generateChatReply({
      query: message,
      matches,
    })
  } catch (chatError) {
    const errorMsg = chatError instanceof Error ? chatError.message : 'Error desconocido'
    console.error('Error generating chat reply:', errorMsg)
    const fallback = buildSearchFallbackReply(message, matches)
    const retrySeconds = parseRetrySeconds(errorMsg)

    if (isQuotaOrRateLimitError(errorMsg)) {
      reply = retrySeconds
        ? `${fallback}\n\nNota: la IA esta temporalmente ocupada por limite de uso. Puedes intentar de nuevo en ~${retrySeconds}s para obtener una respuesta mas detallada.`
        : `${fallback}\n\nNota: la IA esta temporalmente ocupada por limite de uso. Puedes intentar de nuevo en unos segundos para obtener una respuesta mas detallada.`
    } else {
      reply = `${fallback}\n\nNota: no pude generar una explicacion adicional de IA en este momento.`
    }
  }

  return NextResponse.json({
    reply,
    matches: matches.map((match) => ({
      id: match.id,
      entrepreneur_id: match.entrepreneur_id,
      slug: slugify(match.business_name ?? match.id),
      business_name: match.business_name,
      description: match.description,
      category: match.category,
      city: match.city,
      business_phone: match.business_phone,
      instagram_handle: match.instagram_handle,
      website_url: match.website_url,
      other_socials: match.other_socials,
      directory_image_path: match.directory_image_path,
      offers_discount: match.offers_discount,
      discount_details: match.discount_details,
      similarity: match.similarity,
    })),
  })
}