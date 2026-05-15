import { supabasePublic } from '@src/shared/lib/supabase'
import { slugify } from '@src/shared/utils/slugify'
import { getPublicImageUrl } from '@src/shared/utils/getPublicImageUrl'
import type { DirectoryProfile, ProfileFilters } from '../types'

type BusinessProfileRow = {
  id: string
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
}

type MembershipRow = {
  status: string | null
  end_at: string | null
}

type ApplicationRow = {
  status: string | null
}

type EntrepreneurRow = {
  full_name: string | null
  business_profiles: BusinessProfileRow | BusinessProfileRow[] | null
  memberships: MembershipRow | MembershipRow[] | null
  applications: ApplicationRow | ApplicationRow[] | null
}

function isVisibleProfile(row: EntrepreneurRow, nowIso: string): boolean {
  const memberships = Array.isArray(row.memberships)
    ? row.memberships
    : row.memberships
    ? [row.memberships]
    : []

  const applications = Array.isArray(row.applications)
    ? row.applications
    : row.applications
    ? [row.applications]
    : []

  const hasActiveMembership = memberships.some(
    (m) => m.status === 'active' && m.end_at && m.end_at > nowIso
  )

  const hasApprovedApplication = applications.some(
    (a) => a.status === 'aprobado'
  )

  return hasActiveMembership && hasApprovedApplication
}

function mapToDirectoryProfile(row: EntrepreneurRow): DirectoryProfile | null {
  const profile = Array.isArray(row.business_profiles)
    ? row.business_profiles[0]
    : row.business_profiles

  if (!profile) return null
  if (!profile.business_name || !profile.business_name.trim()) return null
  if (!profile.business_phone || !profile.business_phone.trim()) return null

  return {
    id: profile.id,
    business_name: profile.business_name,
    description: profile.description,
    category: profile.category,
    city: profile.city,
    business_phone: profile.business_phone,
    instagram_handle: profile.instagram_handle,
    website_url: profile.website_url,
    other_socials: profile.other_socials,
    directory_image_path: getPublicImageUrl(profile.directory_image_path),
    offers_discount: profile.offers_discount ?? false,
    discount_details: profile.discount_details,
    full_name: row.full_name,
    slug: slugify(profile.business_name),
    is_verified: true,
  }
}

export async function getProfiles(filters?: ProfileFilters): Promise<DirectoryProfile[]> {
  try {
    let query = supabasePublic.from('entrepreneurs').select(`
      full_name,
      business_profiles (
        id,
        business_name,
        description,
        category,
        city,
        business_phone,
        instagram_handle,
        website_url,
        other_socials,
        directory_image_path,
        offers_discount,
        discount_details
      ),
      memberships ( status, end_at ),
      applications ( status )
    `)

    if (filters?.q) {
      const term = filters.q.trim()
      if (term) {
        query = query.or(`business_name.ilike.%${term}%,description.ilike.%${term}%`, {
          foreignTable: 'business_profiles',
        })
      }
    }

    if (filters?.categoria) {
      const category = filters.categoria.trim()
      if (category) {
        query = query.eq('business_profiles.category', category)
      }
    }

    if (filters?.ciudad) {
      const city = filters.ciudad.trim()
      if (city) {
        query = query.eq('business_profiles.city', city)
      }
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch profiles: ${error.message}`)
    }

    if (!data || data.length === 0) return []

    const nowIso = new Date().toISOString()
    const rows = data as EntrepreneurRow[]

    const visibleProfiles: DirectoryProfile[] = []

    for (const row of rows) {
      if (!row || !isVisibleProfile(row, nowIso)) continue

      const mapped = mapToDirectoryProfile(row)
      if (!mapped) continue

      visibleProfiles.push(mapped)
    }

    return visibleProfiles
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`getProfiles failed: ${error.message}`)
    }

    throw new Error('getProfiles failed: unknown error')
  }
}

export async function getProfileBySlug(slug: string): Promise<DirectoryProfile | null> {
  try {
    if (!slug || !slug.trim()) return null

    const profiles = await getProfiles()

    return profiles.find((profile) => profile.slug === slug) ?? null
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`getProfileBySlug failed: ${error.message}`)
    }
    throw new Error('getProfileBySlug failed: unknown error')
  }
}
