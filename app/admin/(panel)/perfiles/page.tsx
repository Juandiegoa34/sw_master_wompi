import Link from 'next/link'
import { adminProfilesService } from '@src/features/admin/services/profiles.admin.service'
import type { AdminProfile } from '@src/features/admin/types'

function formatDate(iso: string): string {
  const d = new Date(iso)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

type MembershipStatus = 'active' | 'inactive' | null
type AppStatus = 'pendiente' | 'aprobado' | 'rechazado' | null

function MembershipBadge({ status }: { status: MembershipStatus }) {
  if (status === 'active') {
    return <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, background: 'rgba(90,122,82,0.15)', color: '#3a6b35' }}>Activa</span>
  }
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, background: 'var(--bg-alt)', color: 'var(--fg-3)' }}>Inactiva</span>
}

const APP_STATUS_STYLE: Record<NonNullable<AppStatus>, React.CSSProperties> = {
  pendiente: { background: 'var(--sw-rose-pale)', color: 'var(--accent)' },
  aprobado: { background: 'rgba(90,122,82,0.15)', color: '#3a6b35' },
  rechazado: { background: 'rgba(139,42,42,0.10)', color: '#8b2a2a' },
}
const APP_STATUS_LABEL: Record<NonNullable<AppStatus>, string> = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobada',
  rechazado: 'Rechazada',
}

function AppStatusBadge({ status }: { status: AppStatus }) {
  if (!status) return <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>—</span>
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, ...APP_STATUS_STYLE[status] }}>
      {APP_STATUS_LABEL[status]}
    </span>
  )
}

export default async function AdminPerfilesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const q = params.q?.trim() || undefined

  const perfiles = await adminProfilesService.list(q)

  return (
    <div>
      {/* AdminHeader */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, paddingBottom: 20, borderBottom: '1px solid var(--sw-line)' }}>
        <div>
          <div className="sw-eyebrow">Admin</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400, fontSize: 38, margin: '8px 0 4px', letterSpacing: '-0.005em', color: 'var(--fg)' }}>
            Perfiles
          </h1>
          <div style={{ fontSize: 13, color: 'var(--fg-2)' }}>
            {perfiles.length} perfil{perfiles.length !== 1 ? 'es' : ''}{q ? ` para "${q}"` : ''}
          </div>
        </div>
        <form method="GET" style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Buscar perfil…"
            style={{ padding: '10px 16px', borderRadius: 999, border: '1px solid var(--sw-line-strong)', background: 'var(--sw-paper)', fontSize: 13, outline: 'none', width: 260, fontFamily: 'var(--font-body)', color: 'var(--fg)' }}
          />
          {q && (
            <Link href="/admin/perfiles" style={{ padding: '10px 16px', borderRadius: 6, border: '1px solid var(--sw-line)', fontSize: 13, color: 'var(--fg-2)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              Limpiar
            </Link>
          )}
        </form>
      </div>

      {/* Tabla */}
      {perfiles.length === 0 ? (
        <div style={{ padding: '64px 0', textAlign: 'center', color: 'var(--fg-3)', fontSize: 13 }}>
          No se encontraron perfiles{q ? ` con "${q}"` : ''}.
        </div>
      ) : (
        <div style={{ background: 'var(--sw-paper)', border: '1px solid var(--sw-line)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-alt)', color: 'var(--fg-2)', textAlign: 'left' }}>
                {['Negocio', 'Empresaria', 'Categoría', 'Membresía', 'Vence', 'Solicitud', ''].map(h => (
                  <th key={h} style={{ padding: '14px 24px', fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perfiles.map((p: AdminProfile) => (
                <tr key={p.entrepreneur_id} style={{ borderTop: '1px solid var(--sw-line)', cursor: 'pointer' }}>
                  <td style={{ padding: '14px 24px', color: 'var(--fg)', fontWeight: 500 }}>{p.business_name ?? '—'}</td>
                  <td style={{ padding: '14px 24px', color: 'var(--fg-2)' }}>{p.full_name ?? '—'}</td>
                  <td style={{ padding: '14px 24px', color: 'var(--fg-2)' }}>{p.category ?? '—'}</td>
                  <td style={{ padding: '14px 24px' }}><MembershipBadge status={p.membership_status} /></td>
                  <td style={{ padding: '14px 24px', color: 'var(--fg-2)' }}>{p.membership_end ? formatDate(p.membership_end) : '—'}</td>
                  <td style={{ padding: '14px 24px' }}><AppStatusBadge status={p.application_status} /></td>
                  <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                    <Link href={`/admin/perfiles/${p.entrepreneur_id}`} style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>Editar →</Link>
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
