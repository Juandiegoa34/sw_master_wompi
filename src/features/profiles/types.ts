export type DirectoryProfile = {
  id: string
  business_name: string
  description: string | null
  category: string | null
  city: string | null
  business_phone: string
  instagram_handle: string | null
  website_url: string | null
  other_socials: string | null
  directory_image_path: string | null
  offers_discount: boolean
  discount_details: string | null
  full_name: string | null
  slug: string
  is_verified: boolean
}

export type ProfileFilters = {
  categoria?: string
  ciudad?: string
  q?: string
}
