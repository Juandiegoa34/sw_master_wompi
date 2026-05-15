import { GoogleGenerativeAI } from '@google/generative-ai'
function getGeminiClient(): GoogleGenerativeAI {
  const geminiApiKey = process.env.GEMINI_API_KEY

  if (!geminiApiKey) {
    throw new Error('Missing env var: GEMINI_API_KEY')
  }

  return new GoogleGenerativeAI(geminiApiKey)
}

function getEmbeddingModel() {
  return getGeminiClient().getGenerativeModel({ model: 'gemini-embedding-001' })
}

const CHAT_MODEL_CANDIDATES = [
  process.env.GEMINI_CHAT_MODEL?.trim(),
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-flash-latest',
  'gemini-2.0-flash-lite',
].filter((value): value is string => Boolean(value))

function normalizeModelName(model: string): string {
  return model.startsWith('models/') ? model.slice('models/'.length) : model
}

async function generateWithChatFallback(prompt: string): Promise<string> {
  let lastError: unknown

  for (const model of CHAT_MODEL_CANDIDATES) {
    try {
      const result = await getGeminiClient()
        .getGenerativeModel({ model: normalizeModelName(model) })
        .generateContent(prompt)
      return result.response.text().trim()
    } catch (error) {
      lastError = error
      console.warn(`Gemini model failed (${model}). Trying next fallback model.`)
    }
  }

  const errorMsg = lastError instanceof Error ? lastError.message : 'Error desconocido'
  throw new Error(`No se pudo generar respuesta de IA: ${errorMsg}`)
}



export type SemanticBusinessMatch = {

  id: string

  entrepreneur_id: string

  business_name: string | null

  description: string | null

  category: string | null

  city: string | null

  business_phone: string | null

  instagram_handle: string | null

  website_url: string | null

  other_socials: string | null

  directory_image_path: string | null

  offers_discount: boolean | null

  discount_details: string | null

  similarity: number | null
}
export function buildEmbeddingInput(fields: Array<string | null | undefined>): string {
  return fields
    .map((field) => (field ?? '').trim())
    .filter(Boolean)
    .join(' | ')
}
export async function generateTextEmbedding(text: string): Promise<number[]> {
  const normalized = text.trim().slice(0, 4000)
  if (!normalized) {
    return []
  }
  const result = await getEmbeddingModel().embedContent(normalized)
  return Array.from(result.embedding.values ?? [])
}

export type ChatIntent = 'search' | 'general'

function looksLikeSearchIntent(message: string): boolean {
  const normalized = message.toLowerCase()
  const searchSignals = [
    'busco',
    'buscar',
    'quiero',
    'necesito',
    'recomienda',
    'recomendame',
    'negocio',
    'emprendimiento',
    'categoria',
    'en medellin',
    'en bogota',
    'comida',
    'restaurante',
    'regalos',
    'joyeria',
    'ropa',
    'domicilio',
  ]

  return searchSignals.some((signal) => normalized.includes(signal))
}

export async function classifyChatIntent(message: string): Promise<ChatIntent> {
  if (looksLikeSearchIntent(message)) {
    return 'search'
  }

  const prompt = [
    'Clasifica la intencion del mensaje del usuario en una sola palabra:',
    '- search: quiere encontrar negocios, categorias, productos o servicios en un directorio.',
    '- general: saludo, conversacion normal o pregunta general.',
    '',
    `Mensaje: ${message}`,
    '',
    'Responde SOLO con: search o general.',
  ].join('\n')

  try {
    const text = (await generateWithChatFallback(prompt)).toLowerCase()
    return text.includes('search') ? 'search' : 'general'
  } catch {
    // Default conservador para no forzar busqueda semantica en saludos.
    return 'general'
  }
}

export async function generateGeneralReply(params: { message: string }): Promise<string> {
  const prompt = [
    'Eres el asistente de SW Mujeres.',
    'Responde en espanol, con tono cercano y breve.',
    'Puedes conversar normalmente y tambien guiar a la usuaria para buscar negocios.',
    'Si la usuaria saluda, saluda y explica en una frase que tambien puedes buscar emprendimientos por ciudad, categoria o necesidad.',
    '',
    `Mensaje del usuario: ${params.message}`,
  ].join('\n')

  const text = await generateWithChatFallback(prompt)
  if (!text) {
    throw new Error('La IA no devolvio contenido para esta consulta.')
  }

  return text
}



export async function generateChatReply(params: {

  query: string

  matches: SemanticBusinessMatch[]

}): Promise<string> {
  const context = params.matches
    .map((match, index) => {
      return [
        `${index + 1}. ${match.business_name ?? 'Negocio sin nombre'}`,
        `Categoria: ${match.category ?? 'Sin categoria'}`,
        `Ciudad: ${match.city ?? 'No especificada'}`,
        `Telefono: ${match.business_phone ?? 'No disponible'}`,
        `Instagram: ${match.instagram_handle ?? 'No disponible'}`,
        `Web: ${match.website_url ?? 'No disponible'}`,
        `Descripcion: ${match.description ?? 'Sin descripcion'}`,
      ].join('\n')
    })
    .join('\n\n')
  const prompt = [
    'Eres un asistente de SW Mujeres, un directorio curado de emprendedoras verificadas.',
    'Responde siempre en espanol, con tono cercano, claro y breve.',
    'Si encuentras coincidencias, resume los mejores resultados en maximo 5 viñetas y sugiere como contactar.',
    'Si no hay coincidencias, explica de forma amable que no encontraste resultados suficientes y sugiere refinar la busqueda.',
    '',
    `Consulta del usuario: ${params.query}`,
    '',
    'Negocios encontrados:',
    context || 'Ninguno.',
  ].join('\n')
  try {
    const text = await generateWithChatFallback(prompt)
    return text || 'No pude generar una respuesta en este momento, pero ya encontre coincidencias en el directorio.'
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error in generateChatReply:', errorMsg)
    throw new Error(errorMsg)
  }
}