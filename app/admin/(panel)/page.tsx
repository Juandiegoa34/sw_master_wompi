// app/admin/(panel)/page.tsx
import Link from 'next/link'
import { applicationsService } from '@src/features/admin/services/applications.service'
import { adminProfilesService } from '@src/features/admin/services/profiles.admin.service'
import { membershipsService } from '@src/features/admin/services/memberships.service'

export default async function AdminDashboardPage() {
  const [pending, all, profiles, alerts] = await Promise.all([
    applicationsService.list('pendiente'),
    applicationsService.list(),
    adminProfilesService.list(),
    membershipsService.getAlerts(),
  ])

  const pendingCount = pending.length
  const totalProfiles = profiles.length
  const activeProfiles = profiles.filter((p) => p.membership_status === 'active').length
  const alertCount = alerts.length

  const today = new Date().toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div>
      {/* AdminHeader */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, paddingBottom: 20, borderBottom: '1px solid var(--sw-line)' }}>
        <div>
          <div className="sw-eyebrow">Admin</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400, fontSize: 38, margin: '8px 0 4px', letterSpacing: '-0.005em', color: 'var(--fg)' }}>
            Dashboard
          </h1>
          <div style={{ fontSize: 13, color: 'var(--fg-2)', textTransform: 'capitalize' }}>{today}</div>
        </div>
        {pendingCount > 0 && (
          <Link
            href="/admin/solicitudes?status=pendiente"
            style={{ padding: '10px 18px', borderRadius: 6, background: 'var(--accent)', color: 'var(--sw-cream)', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}
          >
            {pendingCount} solicitud{pendingCount !== 1 ? 'es' : ''} pendiente{pendingCount !== 1 ? 's' : ''} →
          </Link>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, marginBottom: 22 }}>
        <Link href="/admin/solicitudes?status=pendiente" style={{ textDecoration: 'none', background: 'var(--sw-paper)', border: '1px solid var(--sw-line)', borderRadius: 10, padding: '22px 24px', display: 'block' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-2)' }}>Solicitudes pendientes</div>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 42, color: pendingCount > 0 ? 'var(--accent)' : 'var(--fg)', lineHeight: 1, marginTop: 12 }}>{pendingCount}</div>
          <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 8 }}>{all.length} en total</div>
        </Link>

        <div style={{ background: 'var(--sw-paper)', border: '1px solid var(--sw-line)', borderRadius: 10, padding: '22px 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-2)' }}>Perfiles registrados</div>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 42, color: 'var(--fg)', lineHeight: 1, marginTop: 12 }}>{totalProfiles}</div>
          <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 8 }}>todas las empresarias</div>
        </div>

        <div style={{ background: 'var(--sw-paper)', border: '1px solid var(--sw-line)', borderRadius: 10, padding: '22px 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-2)' }}>Activos en directorio</div>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 42, color: 'var(--accent)', lineHeight: 1, marginTop: 12 }}>{activeProfiles}</div>
          <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 8 }}>membresía vigente</div>
        </div>

        <Link href="/admin/membresias" style={{ textDecoration: 'none', background: 'var(--sw-paper)', border: '1px solid var(--sw-line)', borderRadius: 10, padding: '22px 24px', display: 'block' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-2)' }}>Alertas de membresía</div>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 42, color: alertCount > 0 ? '#dc2626' : 'var(--fg)', lineHeight: 1, marginTop: 12 }}>{alertCount}</div>
          <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 8 }}>vencidas o por vencer</div>
        </Link>
      </div>

      {/* Fila inferior: tabla pendientes + quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18, marginTop: 4 }}>
        {/* Solicitudes recientes */}
        <div style={{ background: 'var(--sw-paper)', border: '1px solid var(--sw-line)', borderRadius: 10, padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="sw-eyebrow">Solicitudes pendientes</div>
            <Link href="/admin/solicitudes?status=pendiente" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>Ver todas →</Link>
          </div>
          {pending.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--fg-3)', padding: '16px 0' }}>Sin solicitudes pendientes.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <tbody>
                {pending.slice(0, 4).map((s, i) => (
                  <tr key={s.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--sw-line)' }}>
                    <td style={{ padding: '14px 0' }}>
                      <div style={{ fontWeight: 500, color: 'var(--fg)' }}>{s.business_profile?.business_name ?? '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>{s.entrepreneur?.full_name ?? ''}</div>
                    </td>
                    <td style={{ padding: '14px 0', textAlign: 'right' }}>
                      <Link href={`/admin/solicitudes/${s.id}`} style={{ padding: '6px 14px', borderRadius: 6, background: 'var(--accent)', color: 'var(--sw-cream)', fontSize: 12, textDecoration: 'none' }}>
                        Revisar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick actions — card oscura */}
        <div style={{ background: 'var(--bg-dark)', color: 'var(--fg-on-dark)', borderRadius: 10, padding: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent-soft)', marginBottom: 16 }}>
            Accesos rápidos
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {([
              ['/admin/solicitudes?status=pendiente', 'Revisar solicitudes pendientes'],
              ['/admin/membresias', 'Ver alertas de membresía'],
              ['/admin/perfiles', 'Ver todos los perfiles'],
              ['/admin/finanzas', 'Registrar entrada manual'],
            ] as [string, string][]).map(([href, label]) => (
              <Link
                key={href}
                href={href}
                style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', background: 'rgba(247,239,233,0.06)', border: '1px solid rgba(247,239,233,0.12)', borderRadius: 6, color: 'var(--sw-cream)', fontSize: 13, textDecoration: 'none' }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
