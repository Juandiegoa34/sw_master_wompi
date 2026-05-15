import type { Metadata } from 'next'
import { ebGaramond, montserrat } from './fonts'
import './globals.css'
import ChatBubble from '@/components/directorio/ChatBubble'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://swmujeres.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'SW Mujeres — Directorio de emprendedoras',
    template: '%s · SW Mujeres',
  },
  description:
    'Encuentra productos y servicios de emprendedoras verificadas de la comunidad SW Mujeres en Medellín y Colombia.',
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: 'SW Mujeres',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${ebGaramond.variable} ${montserrat.variable} h-full antialiased`}>
      <head>
        {SUPABASE_URL && (
          <link rel="preconnect" href={SUPABASE_URL} />
        )}
      </head>
      <body className="min-h-full flex flex-col font-body">
        {children}
        <ChatBubble />
      </body>
    </html>
  )
}
