// app/admin/(panel)/layout.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { verifySession, SESSION_COOKIE_NAME } from '@src/shared/lib/auth'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionToken) redirect('/admin/login')

  const adminEmail = await verifySession(sessionToken)
  if (!adminEmail) redirect('/admin/login')

  const adminName = adminEmail.split('@')[0]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)' }}>
      {/* Sidebar oscuro */}
      <aside style={{ background: 'var(--bg-dark)', color: 'var(--fg-on-dark)', padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-sw-4.svg" alt="SW" width={32} height={32} style={{ filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.22em', color: 'var(--sw-cream)' }}>MUJERES</div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', color: 'var(--accent-soft)' }}>ADMIN</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <NavLink href="/admin">Dashboard</NavLink>
          <NavLink href="/admin/solicitudes">Solicitudes</NavLink>
          <NavLink href="/admin/perfiles">Perfiles</NavLink>
          <NavLink href="/admin/membresias">Membresías</NavLink>
          <NavLink href="/admin/finanzas">Finanzas</NavLink>
        </nav>

        {/* Footer */}
        <div style={{ marginTop: 'auto', padding: '14px 12px', borderTop: '1px solid rgba(247,239,233,0.12)', fontSize: 12, color: 'var(--fg-on-dark-2)' }}>
          <div style={{ fontWeight: 600, color: 'var(--sw-cream)', textTransform: 'capitalize' }}>{adminName}</div>
          <div style={{ fontSize: 11, marginBottom: 10 }}>{adminEmail}</div>
          <form action="/api/admin/logout" method="POST">
            <button type="submit" style={{ fontSize: 11, color: 'var(--fg-on-dark-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)' }}>
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Contenido principal */}
      <main style={{ padding: '32px 48px 80px', overflow: 'hidden' }}>
        {children}
      </main>
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="admin-nav-link"
    >
      {children}
    </Link>
  )
}
