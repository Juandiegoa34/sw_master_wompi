/**
 * Converts a raw Supabase Storage path to a full public URL.
 * If the value is already a full URL (starts with http), it is returned unchanged.
 * Returns null if the path is null or empty.
 */
export function getPublicImageUrl(path: string | null): string | null {
  if (!path || !path.trim()) return null
  if (path.startsWith('http')) return path
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  return `${supabaseUrl}/storage/v1/object/public/${path}`
}
