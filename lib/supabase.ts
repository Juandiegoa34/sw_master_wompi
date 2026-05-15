// Cliente público de Supabase — usa la anon key, seguro para importar en Client Components.
// NUNCA importar supabaseAdmin desde este archivo; vive en lib/supabase-admin.ts (server-only).
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing env var: NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing env var: NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey)
