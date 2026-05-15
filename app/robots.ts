import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://swmujeres.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/directorio', '/directorio/'],
        disallow: ['/admin/', '/estadisticas/', '/api/', '/inscripcion'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
