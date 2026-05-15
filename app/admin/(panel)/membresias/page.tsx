// app/admin/(panel)/membresias/page.tsx
// Lista de alertas de membresía + tabla completa de todas las membresías.

import Link from 'next/link'
import { membershipsService } from '@src/features/admin/services/memberships.service'
import { adminProfilesService } from '@src/features/admin/services/profiles.admin.service'
import type { MembershipAlert, AdminProfile } from '@src/features/admin/types'

// ---------------------------------------------------------------------------
// Helpers de formateo
// ---------------------------------------------------------------------------

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function daysFromNow(iso: string | null): number | null {
  if (!iso) return null
  return Math.floor((new Date(iso).getTime() - Date.now()) / 86_400_000)
}

// ---------------------------------------------------------------------------
// Subcomponente: badge de días (para alertas)
// ---------------------------------------------------------------------------

function DaysBadge({ days }: { days: number }) {
  if (days < 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
        Venció hace {Math.abs(days)} {Math.abs(days) === 1 ? 'día' : 'días'}
      </span>
    )
  }
  if (days === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
        Vence hoy
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-sw-blush-mist px-2.5 py-0.5 text-xs font-medium text-sw-burgundy">
      Vence en {days} {days === 1 ? 'día' : 'días'}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Subcomponente: badge de status de membresía
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: 'active' | 'inactive' | null }) {
  if (status === 'active') {
    return <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, background: 'rgba(90,122,82,0.15)', color: '#3a6b35' }}>Activa</span>
  }
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, background: 'var(--bg-alt)', color: 'var(--fg-3)' }}>Inactiva</span>
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------

export default async function MembresiasPage() {
  const [alerts, profiles] = await Promise.all([
    membershipsService.getAlerts(),
    adminProfilesService.list(),
  ])

  // Activas primero, luego inactivas
  const sorted = [...profiles].sort((a, b) => {
    if (a.membership_status === b.membership_status) return 0
    return a.membership_status === 'active' ? -1 : 1
  })

  return (
    <div>
      {/* AdminHeader */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, paddingBottom: 20, borderBottom: '1px solid var(--sw-line)' }}>
        <div>
          <div className="sw-eyebrow">Admin</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400, fontSize: 38, margin: '8px 0 4px', letterSpacing: '-0.005em', color: 'var(--fg)' }}>
            Membresías
          </h1>
          <div style={{ fontSize: 13, color: 'var(--fg-2)' }}>
            {profiles.filter(p => p.membership_status === 'active').length} activas · {alerts.length} con alertas
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18, marginBottom: 22 }}>
        <div style={{ background: 'var(--sw-paper)', border: '1px solid var(--sw-line)', borderRadius: 10, padding: '22px 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-2)' }}>Activas</div>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 42, color: 'var(--fg)', lineHeight: 1, marginTop: 12 }}>{profiles.filter(p => p.membership_status === 'active').length}</div>
        </div>
        <div style={{ background: 'var(--sw-paper)', border: '1px solid var(--sw-line)', borderRadius: 10, padding: '22px 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-2)' }}>Alertas activas</div>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 42, color: alerts.length > 0 ? 'var(--accent)' : 'var(--fg)', lineHeight: 1, marginTop: 12 }}>{alerts.length}</div>
          <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 8 }}>vencidas o por vencer</div>
        </div>
        <div style={{ background: 'var(--sw-paper)', border: '1px solid var(--sw-line)', borderRadius: 10, padding: '22px 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-2)' }}>Inactivas</div>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 42, color: 'var(--fg-3)', lineHeight: 1, marginTop: 12 }}>{profiles.filter(p => p.membership_status !== 'active').length}</div>
        </div>
      </div>

      {/* Tabla */}
      <div style={{ background: 'var(--sw-paper)', border: '1px solid var(--sw-line)', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--bg-alt)', color: 'var(--fg-2)', textAlign: 'left' }}>
              {['Negocio', 'Inicio', 'Vence', 'Días restantes', 'Estado', ''].map(h => (
                <th key={h} style={{ padding: '14px 24px', fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p: AdminProfile) => {
              const days = daysFromNow(p.membership_end)
              const urgent = days !== null && days < 14
              return (
                <tr key={p.entrepreneur_id} style={{ borderTop: '1px solid var(--sw-line)' }}>
                  <td style={{ padding: '14px 24px', color: 'var(--fg)', fontWeight: 500 }}>{p.business_name ?? '—'}</td>
                  <td style={{ padding: '14px 24px', color: 'var(--fg-2)' }}>{formatDate(p.membership_start)}</td>
                  <td style={{ padding: '14px 24px', color: 'var(--fg-2)' }}>{formatDate(p.membership_end)}</td>
                  <td style={{ padding: '14px 24px', color: urgent ? '#dc2626' : 'var(--fg)', fontWeight: urgent ? 600 : 400 }}>
                    {days !== null ? `${days < 0 ? '−' : ''}${Math.abs(days)}d` : '—'}
                  </td>
                  <td style={{ padding: '14px 24px' }}><StatusBadge status={p.membership_status} /></td>
                  <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                    <Link href={`/admin/perfiles/${p.entrepreneur_id}`} style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
                      Gestionar
                    </Link>
                  </td>
                </tr>
              )
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--fg-3)' }}>
                  No hay membresías registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
