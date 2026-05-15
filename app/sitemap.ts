import type { MetadataRoute } from 'next'
import { profilesService } from '@src/features/profiles/services/profiles.service'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://swmujeres.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const profiles = await profilesService.findAll()

  const profileUrls: MetadataRoute.Sitemap = profiles.map((p) => ({
    url: `${SITE_URL}/directorio/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/directorio`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...profileUrls,
  ]
}
