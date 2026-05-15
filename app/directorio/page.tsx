import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { profilesService } from '@src/features/profiles/services/profiles.service'
import { CATEGORIES } from '@src/shared/utils/categories'
import PreviewCard from '@/components/directorio/PreviewCard'
import ChatBubble from '@/components/directorio/ChatBubble'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Directorio de emprendedoras',
  description:
    'Busca y filtra emprendimientos verificados de la comunidad SW Mujeres por categoría, ciudad y nombre.',
  openGraph: {
    title: 'Directorio de emprendedoras · SW Mujeres',
    description:
      'Busca emprendimientos verificados de la comunidad SW Mujeres por categoría y ciudad.',
    url: '/directorio',
  },
}

const CITIES = ['Medellín', 'Bogotá', 'Cali', 'Envigado', 'Sabaneta', 'Itagüí', 'Bello', 'Rionegro']


function buildUrl(params: { q?: string; categoria?: string; ciudad?: string }): string {
  const parts: string[] = []
  if (params.q) parts.push(`q=${encodeURIComponent(params.q)}`)
  if (params.categoria) parts.push(`categoria=${encodeURIComponent(params.categoria)}`)
  if (params.ciudad) parts.push(`ciudad=${encodeURIComponent(params.ciudad)}`)
  return parts.length > 0 ? `/directorio?${parts.join('&')}` : '/directorio'
}


type SearchParams = Promise<{ q?: string; categoria?: string; ciudad?: string }>

export default async function DirectorioPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const q = params.q?.trim() ?? ''
  const categoria = params.categoria?.trim() ?? ''
  const ciudad = params.ciudad?.trim() ?? ''

  const profiles = await profilesService.findAll({
    q: q || undefined,
    categoria: categoria || undefined,
    ciudad: ciudad || undefined,
  })

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--fg)', fontFamily: 'var(--font-body)', minHeight: '100vh' }}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 64px', borderBottom: '1px solid var(--sw-line)',
      }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Image src="/logo-sw-4.svg" width={120} height={120} alt="SW Mujeres" />
        </Link>
        <nav style={{ display: 'flex', gap: 36 }}>
          <Link href="/directorio" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)' }}>Directorio</Link>
        </nav>
      </header>

      {/* ── Hero small ───────────────────────────────────────────── */}
      <section style={{ padding: '56px 64px 32px', borderBottom: '1px solid var(--sw-line)' }}>
        <div style={{ fontSize: 12, color: 'var(--fg-2)', letterSpacing: '0.04em', marginBottom: 18 }}>
          <Link href="/" style={{ color: 'var(--fg-3)' }}>Inicio</Link>
          <span style={{ margin: '0 8px', color: 'var(--fg-3)' }}>›</span>
          <span style={{ color: 'var(--accent)' }}>Directorio</span>
        </div>
        <span className="sw-eyebrow">Confianza verificada</span>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400,
          fontSize: 56, lineHeight: 1.05, margin: '12px 0 14px', letterSpacing: '-0.01em',
        }}>
          Busca negocios <span style={{ color: 'var(--accent)' }}>verificados.</span>
        </h1>
        <p style={{ fontSize: 15, color: 'var(--fg-2)', maxWidth: 580, lineHeight: 1.7 }}>
          Descubre {profiles.length}+ negocios liderados por mujeres en Medellín y Antioquia. Todas verificadas manualmente por SW.
        </p>

        {/* Search */}
        <form method="get" action="/directorio" style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 10px 10px 22px',
          background: 'var(--sw-paper)', borderRadius: 999, maxWidth: 620, marginTop: 28,
          border: '1px solid var(--sw-line-strong)',
        }}>
          {categoria && <input type="hidden" name="categoria" value={categoria} />}
          {ciudad && <input type="hidden" name="ciudad" value={ciudad} />}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E6571" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar negocio, categoría o palabra clave…"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: 'var(--fg)' }}
          />
          <button type="submit" style={{
            padding: '10px 22px', borderRadius: 999, background: 'var(--accent)',
            color: 'var(--sw-cream)', border: 'none', fontSize: 13, fontWeight: 500,
          }}>Buscar</button>
          {(q || categoria || ciudad) && (
            <Link href="/directorio" style={{ padding: '10px 16px', borderRadius: 999, fontSize: 13, color: 'var(--fg-2)' }}>
              Limpiar
            </Link>
          )}
        </form>
      </section>

      {/* ── Body: sidebar + grid ─────────────────────────────────── */}
      <section style={{ padding: '48px 64px 80px', display: 'grid', gridTemplateColumns: '240px 1fr', gap: 48 }}>

        {/* Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* Categorías */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22 }}>Filtros</span>
              {(q || categoria || ciudad) && (
                <Link href="/directorio" style={{ fontSize: 12, color: 'var(--accent)' }}>Limpiar</Link>
              )}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-2)', marginBottom: 10 }}>Categoría</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li>
                <Link
                  href={buildUrl({ q: q || undefined, ciudad: ciudad || undefined })}
                  style={{
                    display: 'flex', justifyContent: 'space-between', fontSize: 13,
                    color: !categoria ? 'var(--accent)' : 'var(--fg)',
                    fontWeight: !categoria ? 600 : 400,
                  }}
                >
                  <span>Todas</span>
                </Link>
              </li>
              {CATEGORIES.map((cat) => (
                <li key={cat}>
                  <Link
                    href={categoria === cat
                      ? buildUrl({ q: q || undefined, ciudad: ciudad || undefined })
                      : buildUrl({ q: q || undefined, categoria: cat, ciudad: ciudad || undefined })
                    }
                    style={{
                      display: 'flex', justifyContent: 'space-between', fontSize: 13,
                      color: categoria === cat ? 'var(--accent)' : 'var(--fg)',
                      fontWeight: categoria === cat ? 600 : 400,
                    }}
                  >
                    <span>{cat}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ciudades */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-2)', marginBottom: 10 }}>Ciudad</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li>
                <Link
                  href={buildUrl({ q: q || undefined, categoria: categoria || undefined })}
                  style={{ fontSize: 13, color: !ciudad ? 'var(--accent)' : 'var(--fg)', fontWeight: !ciudad ? 600 : 400 }}
                >Todas</Link>
              </li>
              {CITIES.map((cit) => (
                <li key={cit}>
                  <Link
                    href={ciudad === cit
                      ? buildUrl({ q: q || undefined, categoria: categoria || undefined })
                      : buildUrl({ q: q || undefined, categoria: categoria || undefined, ciudad: cit })
                    }
                    style={{ fontSize: 13, color: ciudad === cit ? 'var(--accent)' : 'var(--fg)', fontWeight: ciudad === cit ? 600 : 400 }}
                  >{cit}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info card */}
          <div style={{ background: 'var(--sw-rose-pale)', borderRadius: 10, padding: 22 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, color: 'var(--bg-dark)', lineHeight: 1.15 }}>
              ¿Cómo<br />verificamos?
            </div>
            <p style={{ fontSize: 12, color: 'var(--bg-dark)', lineHeight: 1.55, margin: '10px 0 14px' }}>
              Revisamos cada solicitud manualmente. Una por una.
            </p>
            <Link href="/inscripcion" style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.06em' }}>Leer proceso →</Link>
          </div>
        </aside>

        {/* Grid */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
            <span style={{ fontSize: 13, color: 'var(--fg-2)' }}>
              <strong style={{ color: 'var(--fg)' }}>{profiles.length}</strong> negocios encontrados
              {categoria && <> · {categoria}</>}
              {ciudad && <> · {ciudad}</>}
            </span>
          </div>

          {profiles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 28, color: 'var(--fg-2)' }}>
                Sin resultados.
              </p>
              <p style={{ fontSize: 13, color: 'var(--fg-3)', marginTop: 8 }}>Intenta con otros filtros.</p>
              <Link href="/directorio" style={{ display: 'inline-block', marginTop: 20, color: 'var(--accent)', fontSize: 13, fontWeight: 500 }}>
                Ver todos →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 28 }}>
              {profiles.map((profile, idx) => (
                <PreviewCard key={profile.id} profile={profile} idx={idx} descMaxLen={80} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer style={{ background: 'var(--bg-dark)', color: 'var(--fg-on-dark)', padding: '40px 64px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image src="/logo-symbol-circle-dark.svg" width={28} height={28} alt="SW" style={{ filter: 'brightness(0) invert(1)' }} />
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.22em' }}>MUJERES</span>
          </div>
          <span style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--fg-on-dark-3)' }}>
            © 2026 SW Mujeres · Medellín
          </span>
          <Link href="/inscripcion" style={{ fontSize: 12, color: 'var(--accent-soft)', fontWeight: 500 }}>Inscribir mi negocio →</Link>
        </div>
      </footer>

      {/* ── AI Chat Bubble ──────────────────────────────────────────── */}
      <ChatBubble />
    </div>
  )
}
