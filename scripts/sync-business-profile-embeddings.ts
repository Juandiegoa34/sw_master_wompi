import { loadEnvConfig } from '@next/env'
import { createClient } from '@supabase/supabase-js'
import { buildEmbeddingInput, generateTextEmbedding } from '../lib/gemini'

loadEnvConfig(process.cwd())

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing env var: NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseServiceRoleKey) {
  throw new Error('Missing env var: SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function main() {
  const { data, error } = await supabase
    .from('business_profiles')
    .select('id, business_name, category, description')
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Error fetching business profiles: ${error.message}`)
  }

  const profiles = data ?? []

  console.log(`Found ${profiles.length} business profiles to process.`)

  for (const profile of profiles) {
    const input = buildEmbeddingInput([
      profile.business_name as string | null,
      profile.category as string | null,
      profile.description as string | null,
    ])

    if (!input) {
      console.log(`Skipping profile ${profile.id} because it has no searchable text.`)
      continue
    }

    const embedding = await generateTextEmbedding(input)

    if (embedding.length === 0) {
      console.log(`Skipping profile ${profile.id} because Gemini returned an empty embedding.`)
      continue
    }

    // Ensure embedding matches DB dimension (3072). Pad or truncate as needed.
    function normalizeTo3072(vec: number[]): number[] {
      if (vec.length === 3072) return vec
      if (vec.length > 3072) return vec.slice(0, 3072)
      const padded = vec.slice()
      while (padded.length < 3072) padded.push(0)
      return padded
    }

    const scaled = normalizeTo3072(embedding)

    if (scaled.length !== 3072) {
      throw new Error(`Unexpected embedding size after normalization for ${profile.id}: ${scaled.length}`)
    }

    const { error: updateError } = await supabase
      .from('business_profiles')
      .update({ embedding: scaled })
      .eq('id', profile.id as string)

    if (updateError) {
      throw new Error(`Error updating embedding for ${profile.id}: ${updateError.message}`)
    }

    console.log(`Updated embedding for ${profile.id}`)
  }

  console.log('Embedding sync completed.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})