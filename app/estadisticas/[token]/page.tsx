import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { trackingService } from '@src/features/tracking/services/tracking.service'
import StatsView from '@components/estadisticas/StatsView'

// Esta página siempre debe mostrar datos frescos — nunca servir desde caché.
export const dynamic = 'force-dynamic'

type Props = {
  params: { token: string }
}

export const metadata: Metadata = {
  title: 'Estadísticas de tu perfil · SW Mujeres',
  robots: { index: false, follow: false }, // página privada, fuera del índice
}

export default async function EstadisticasPage({ params }: Props) {
  const { token } = await params
  const stats = await trackingService.getFullStats(token)

  if (!stats) notFound()

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <StatsView stats={stats} />
    </main>
  )
}
