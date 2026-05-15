import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { profilesService } from '@src/features/profiles/services/profiles.service'
import PreviewCard from '@/components/directorio/PreviewCard'
import { CATEGORY_NAMES, CategoryIcon } from '@/components/icons/categories'
import { SearchIcon } from '@/components/icons/ui'

export const metadata: Metadata = {
  title: 'SW Mujeres - Directorio de emprendedoras',
  description:
    'Descubre productos y servicios de emprendedoras verificadas de la comunidad SW Mujeres en Medellin y Colombia.',
}

const navItems = [
  ['Directorio', '/directorio'],
  ['Categorias', '/directorio'],
  ['Quienes somos', '#comunidad'],
  ['Recursos', '#recursos'],
  ['Blog', '#blog'],
]

const s = {
  shell: {
    minHeight: '100vh',
    background:
      'radial-gradient(circle at 18% 8%, rgba(230,182,198,0.20), transparent 26%), radial-gradient(circle at 80% 4%, rgba(231,177,165,0.16), transparent 28%), #f8efe9',
    color: 'var(--fg)',
    fontFamily: 'var(--font-body)',
  },
  frame: {
    width: 'min(1480px, calc(100% - 64px))',
    margin: '0 auto',
  },
  nav: {
    display: 'grid',
    gridTemplateColumns: '132px minmax(0, 1fr) auto',
    gap: 36,
    alignItems: 'center',
    padding: '22px 0 8px',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: 42,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'rgba(57,17,37,0.88)',
  },
  navActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 14,
  },
  pillDark: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    padding: '0 30px',
    borderRadius: 999,
    background: '#391125',
    color: '#f7efe9',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
  },
  pillLight: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    padding: '0 24px',
    borderRadius: 999,
    border: '1px solid rgba(130,22,65,0.32)',
    color: '#391125',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: 'minmax(420px, 1fr) minmax(340px, 0.62fr)',
    gap: 56,
    alignItems: 'center',
    padding: '42px 0 30px',
  },
  h1: {
    margin: 0,
    maxWidth: 620,
    fontFamily: 'var(--font-display), Georgia, serif',
    fontSize: 'clamp(64px, 5.15vw, 88px)',
    fontWeight: 400,
    lineHeight: 0.98,
    letterSpacing: '-0.018em',
    color: '#391125',
  },
  lead: {
    maxWidth: 445,
    margin: '28px 0 0',
    color: '#6b3f4f',
    fontSize: 15,
    lineHeight: 1.75,
  },
  search: {
    display: 'flex',
    alignItems: 'center',
    width: 'min(100%, 475px)',
    minHeight: 58,
    marginTop: 28,
    padding: '8px 8px 8px 28px',
    border: '1px solid rgba(57,17,37,0.14)',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.50)',
    boxShadow: '0 18px 38px rgba(57,17,37,0.08)',
    color: '#8e6571',
  },
  sideStack: {
    display: 'grid',
    gap: 24,
    transform: 'translateX(-28px)',
  },
  darkCard: {
    position: 'relative',
    minHeight: 258,
    overflow: 'visible',
    padding: 36,
    borderRadius: 16,
    background:
      'radial-gradient(circle at 82% 22%, rgba(230,182,198,0.18), transparent 34%), linear-gradient(135deg,#6b1f3f,#391125)',
    color: '#f7efe9',
    boxShadow: '0 20px 44px rgba(57,17,37,0.11)',
  },
  softCard: {
    border: '1px solid rgba(57,17,37,0.12)',
    borderRadius: 16,
    background: 'rgba(250,244,240,0.78)',
    boxShadow: '0 18px 42px rgba(57,17,37,0.06)',
  },
  sectionStack: {
    display: 'grid',
    gap: 34,
    paddingBottom: 34,
  },
  lowerGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(360px, 0.48fr)',
    gap: 28,
    alignItems: 'stretch',
  },
} satisfies Record<string, CSSProperties>

function TopNav() {
  return (
    <header style={s.nav} className="sw-ref-nav">
      <Link href="/" aria-label="SW Mujeres" style={{ display: 'inline-flex', alignItems: 'center' }}>
        <Image src="/logo-sw-4.svg" width={104} height={104} alt="" priority style={{ width: 104, height: 'auto' }} />
      </Link>
      <nav style={s.navLinks} className="sw-ref-navlinks" aria-label="Principal">
        {navItems.map(([label, href]) => (
          <Link key={label} href={href}>
            {label}
          </Link>
        ))}
      </nav>
      <div style={s.navActions} className="sw-ref-actions">
        <Link href="/inscripcion" style={s.pillDark}>
          Se parte
        </Link>
        <Link href="/admin/login" style={s.pillLight}>
          Mi cuenta
        </Link>
      </div>
    </header>
  )
}

function SearchBox() {
  return (
    <form action="/directorio" method="get" style={s.search}>
      <input
        name="q"
        placeholder="Buscar negocio, categoria o palabra clave..."
        style={{
          minWidth: 0,
          flex: 1,
          border: 0,
          outline: 0,
          background: 'transparent',
          color: '#391125',
          fontSize: 12,
        }}
      />
      <button
        type="submit"
        aria-label="Buscar"
        style={{
          width: 44,
          height: 44,
          border: 0,
          borderRadius: 999,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg,#bd4d74,#821641)',
          color: '#f7efe9',
          boxShadow: '0 10px 22px rgba(130,22,65,0.22)',
        }}
      >
        <SearchIcon size={20} />
      </button>
    </form>
  )
}

function CommunityCard() {
  return (
    <aside style={s.darkCard} id="comunidad">
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 270 }}>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(247,239,233,0.72)' }}>
          Comunidad SW
        </span>
        <h2 style={{ margin: '18px 0 16px', fontFamily: 'var(--font-display)', fontSize: 34, fontStyle: 'italic', fontWeight: 400, lineHeight: 1.05 }}>
          Juntas llegamos mas lejos
        </h2>
        <p style={{ margin: 0, color: 'rgba(247,239,233,0.82)', fontSize: 13, lineHeight: 1.65 }}>
          Somos una red de mujeres que se apoyan, colaboran y crecen juntas cada dia.
        </p>
        <Link href="/directorio" style={{ display: 'inline-block', marginTop: 22, color: '#f7efe9', fontSize: 12, fontWeight: 600 }}>
          Conoce nuestra comunidad →
        </Link>
      </div>
      <Image
        src="/11.svg"
        width={190}
        height={190}
        alt=""
        className="sw-ref-community-seal"
        aria-hidden="true"
      />
    </aside>
  )
}

function Metrics({ businessCount }: { businessCount: string }) {
  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', minHeight: 152, padding: '26px 18px' }}>
      {[
        [businessCount, 'Negocios activos'],
        ['13.500+', 'Mujeres conectadas'],
        ['15+', 'Categorias diversas'],
      ].map(([value, label], index) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, textAlign: 'center', borderLeft: index ? '1px solid rgba(57,17,37,0.12)' : undefined }}>
          <strong style={{ color: '#821641', fontFamily: 'var(--font-display)', fontSize: 31, fontWeight: 400, lineHeight: 1 }}>{value}</strong>
          <small style={{ maxWidth: 92, color: '#6b3f4f', fontSize: 11, lineHeight: 1.35 }}>{label}</small>
        </div>
      ))}
    </section>
  )
}

function CategoryRail() {
  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: '220px 1fr',
        minHeight: 112,
        overflow: 'hidden',
        borderTop: '1px solid rgba(57,17,37,0.12)',
        borderBottom: '1px solid rgba(57,17,37,0.12)',
        background: 'rgba(250,244,240,0.34)',
      }}
      className="sw-ref-category"
    >
      <div style={{ padding: '24px 36px' }}>
        <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 25, lineHeight: 1 }}>Explora por</span>
        <strong style={{ color: '#821641', fontFamily: 'var(--font-display)', fontSize: 29, fontStyle: 'italic', fontWeight: 400, lineHeight: 1 }}>categorias</strong>
      </div>
      <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(10, minmax(64px, 1fr))', margin: 0, padding: 0, listStyle: 'none' }} className="sw-ref-category-list">
        {CATEGORY_NAMES.map((label) => (
          <li key={label} className="sw-ref-category-item" style={{ borderLeft: '1px solid rgba(57,17,37,0.10)' }}>
            <Link href={`/directorio?category=${encodeURIComponent(label)}`} className="sw-ref-category-link" style={{ width: '100%', height: '100%', minHeight: 112, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 12, fontWeight: 500 }}>
              <span className="sw-ref-category-icon" style={{ display: 'inline-flex', width: 30, height: 30, alignItems: 'center', justifyContent: 'center' }}>
                <CategoryIcon name={label} />
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Featured({ profiles }: { profiles: Awaited<ReturnType<typeof profilesService.findAll>> }) {
  const previewProfiles = profiles.slice(0, 4)

  return (
    <section
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '185px minmax(0, 1fr)',
        gap: 20,
        padding: '24px 46px 24px 28px',
      }}
      className="sw-ref-featured"
    >
      <div>
        <h2 style={{ margin: 0, color: '#391125', fontFamily: 'var(--font-display)', fontSize: 32, fontStyle: 'italic', fontWeight: 400, lineHeight: 1.08 }}>
          Negocios destacados
        </h2>
        <p style={{ margin: '16px 0 18px', color: '#6b3f4f', fontSize: 12, lineHeight: 1.6 }}>
          Descubre marcas increibles lideradas por mujeres como tu.
        </p>
        <Link href="/directorio" style={{ color: '#821641', fontSize: 12, fontWeight: 600 }}>
          Ver todos →
        </Link>
      </div>
      {previewProfiles.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }} className="sw-ref-featured-cards">
          {previewProfiles.map((profile, idx) => (
            <PreviewCard key={profile.id} profile={profile} idx={idx} descMaxLen={34} />
          ))}
        </div>
      ) : (
        <p style={{ color: '#6b3f4f' }}>El directorio se esta armando.</p>
      )}
    </section>
  )
}

function ResourceBanner() {
  return (
    <section id="recursos" style={{ ...s.softCard, position: 'relative', minHeight: 180, overflow: 'hidden', display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', alignItems: 'center', padding: '28px 38px', background: 'linear-gradient(135deg,#f2c8bd,#f7efe9 58%,#d9ad9e)' }} className="sw-ref-resource">
      <div>
        <span style={{ color: '#a9375f', fontFamily: 'var(--font-display)', fontSize: 28, fontStyle: 'italic' }}>Para ti</span>
        <h2 style={{ maxWidth: 450, margin: '0 0 8px', fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, lineHeight: 1.08 }}>Recursos que impulsan tu negocio</h2>
        <p style={{ margin: 0, color: '#6b3f4f', fontSize: 12 }}>Guias, plantillas y herramientas para crecer cada dia.</p>
      </div>
      <div className="sw-ref-papers" aria-hidden="true">
        <i>Guia para emprender con proposito</i>
        <i>Plan de marketing digital</i>
        <i>Checklist para organizar tu negocio</i>
      </div>
    </section>
  )
}

function Newsletter() {
  return (
    <aside id="blog" style={{ ...s.darkCard, minHeight: 218 }}>
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 280 }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 29, fontWeight: 400, lineHeight: 1.1 }}>Recibe inspiracion cada semana</h2>
        <p style={{ color: 'rgba(247,239,233,0.80)', fontSize: 12, lineHeight: 1.6 }}>Historias, consejos y novedades para impulsar tu negocio.</p>
        <form style={{ display: 'flex', alignItems: 'center', minHeight: 44, marginTop: 18, padding: 5, borderRadius: 999, background: '#f7efe9' }}>
          <input type="email" placeholder="Tu correo electronico" aria-label="Tu correo electronico" style={{ minWidth: 0, flex: 1, border: 0, outline: 0, padding: '0 14px', background: 'transparent', color: '#391125', fontSize: 12 }} />
          <button type="submit" aria-label="Suscribirme" style={{ width: 34, height: 34, border: 0, borderRadius: 999, background: '#a9375f', color: '#f7efe9' }}>→</button>
        </form>
      </div>
      <div className="sw-ref-vase" aria-hidden="true" />
    </aside>
  )
}

export default async function LandingPage() {
  const profiles = await profilesService.findAll()
  const businessCount = profiles.length > 0 ? `${profiles.length}+` : '250+'

  return (
    <main style={s.shell}>
      <div style={s.frame}>
        <TopNav />
        <section style={s.hero} className="sw-ref-hero">
          <div>
            <h1 style={s.h1}>
              Negocios que inspiran, <em style={{ color: '#a9375f', fontWeight: 500 }}>mujeres</em> que transforman.
            </h1>
            <span style={{ display: 'block', width: 70, height: 13, margin: '18px 0 24px', borderBottom: '2px solid #a9375f', borderRadius: '50%' }} aria-hidden="true" />
            <p style={s.lead}>Un directorio que conecta, visibiliza y apoya negocios creados por mujeres en Medellin.</p>
            <SearchBox />
            <div className="sw-ref-proof">
              <span /><span /><span /><span /><span />
              <strong>{businessCount} negocios activos</strong>
            </div>
          </div>
          <div style={s.sideStack}>
            <CommunityCard />
            <Metrics businessCount={businessCount} />
          </div>
        </section>
        <section style={s.sectionStack}>
          <CategoryRail />
          <Featured profiles={profiles} />
          <div style={s.lowerGrid} className="sw-ref-lower">
            <ResourceBanner />
            <Newsletter />
          </div>
        </section>
      </div>
    </main>
  )
}
