import Link from 'next/link'
import { applicationsService } from '@src/features/admin/services/applications.service'
import type { AdminApplication } from '@src/features/admin/types'

type StatusFilter = 'pendiente' | 'aprobado' | 'rechazado'

function isValidStatus(s: string | undefined): s is StatusFilter {
  return s === 'pendiente' || s === 'aprobado' || s === 'rechazado'
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

const STATUS_LABELS: Record<StatusFilter, string> = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobada',
  rechazado: 'Rechazada',
}

const STATUS_BADGE_STYLE: Record<StatusFilter, React.CSSProperties> = {
  pendiente: { background: 'var(--sw-rose-pale)', color: 'var(--accent)' },
  aprobado: { background: 'rgba(90,122,82,0.15)', color: '#3a6b35' },
  rechazado: { background: 'rgba(139,42,42,0.10)', color: '#8b2a2a' },
}

function StatusBadge({ status }: { status: StatusFilter }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, ...STATUS_BADGE_STYLE[status] }}>
      {STATUS_LABELS[status]}
    </span>
  )
}

export default async function AdminSolicitudesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const rawStatus = params.status
  const activeFilter = isValidStatus(rawStatus) ? rawStatus : undefined

  const [allSolicitudes, pendientesSolicitudes] = await Promise.all([
    applicationsService.list(activeFilter),
    applicationsService.list('pendiente'),
  ])

  const solicitudes = allSolicitudes
  const pendientesCount = pendientesSolicitudes.length

  const tabs: { label: string; href: string; value: string | undefined }[] = [
    { label: 'Todas', href: '/admin/solicitudes', value: undefined },
    { label: 'Pendientes', href: '/admin/solicitudes?status=pendiente', value: 'pendiente' },
    { label: 'Aprobadas', href: '/admin/solicitudes?status=aprobado', value: 'aprobado' },
    { label: 'Rechazadas', href: '/admin/solicitudes?status=rechazado', value: 'rechazado' },
  ]

  const emptyMessages: Record<string, string> = {
    pendiente: 'No hay solicitudes pendientes de revisión.',
    aprobado: 'No hay solicitudes aprobadas.',
    rechazado: 'No hay solicitudes rechazadas.',
    all: 'No hay solicitudes registradas.',
  }
  const emptyMsg = emptyMessages[activeFilter ?? 'all']

  return (
    <div>
      {/* AdminHeader */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, paddingBottom: 20, borderBottom: '1px solid var(--sw-line)' }}>
        <div>
          <div className="sw-eyebrow">Admin</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400, fontSize: 38, margin: '8px 0 4px', letterSpacing: '-0.005em', color: 'var(--fg)' }}>
            Solicitudes
          </h1>
          <div style={{ fontSize: 13, color: 'var(--fg-2)' }}>{pendientesCount} pendiente{pendientesCount !== 1 ? 's' : ''} de revisión</div>
        </div>
      </div>

      {/* Tabs de filtro */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--sw-line)', marginBottom: 24 }}>
        {tabs.map((tab) => {
          const isActive = tab.value === activeFilter
          return (
            <Link
              key={tab.label}
              href={tab.href}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '10px 16px', fontSize: 13, fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--accent)' : 'var(--fg-3)',
                borderBottom: `2px solid ${isActive ? 'var(--sw-burgundy)' : 'transparent'}`,
                marginBottom: -1, textDecoration: 'none', transition: 'color 150ms',
              }}
            >
              {tab.label}
              {tab.value === 'pendiente' && pendientesCount > 0 && (
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, background: 'var(--accent)', color: 'var(--sw-cream)', fontWeight: 600 }}>
                  {pendientesCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Tabla */}
      {solicitudes.length === 0 ? (
        <div style={{ padding: '64px 0', textAlign: 'center', color: 'var(--fg-3)', fontSize: 13 }}>{emptyMsg}</div>
      ) : (
        <div style={{ background: 'var(--sw-paper)', border: '1px solid var(--sw-line)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-alt)', color: 'var(--fg-2)', textAlign: 'left' }}>
                {['Empresaria', 'Negocio', 'Categoría', 'Enviada', 'Estado', ''].map(h => (
                  <th key={h} style={{ padding: '14px 24px', fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((s: AdminApplication) => (
                <tr key={s.id} style={{ borderTop: '1px solid var(--sw-line)' }}>
                  <td style={{ padding: '16px 24px', color: 'var(--fg)', fontWeight: 500 }}>{s.entrepreneur.full_name ?? '—'}</td>
                  <td style={{ padding: '16px 24px', color: 'var(--fg-2)' }}>{s.business_profile.business_name ?? '—'}</td>
                  <td style={{ padding: '16px 24px', color: 'var(--fg-2)' }}>{s.business_profile.category ?? '—'}</td>
                  <td style={{ padding: '16px 24px', color: 'var(--fg-2)' }}>{formatDate(s.submitted_at)}</td>
                  <td style={{ padding: '16px 24px' }}><StatusBadge status={s.status} /></td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <Link href={`/admin/solicitudes/${s.id}`} style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>Ver →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
