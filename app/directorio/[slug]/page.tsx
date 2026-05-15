import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { profilesService } from '@src/features/profiles/services/profiles.service'
import { slugify } from '@src/shared/utils/slugify'
import { formatPhone } from '@src/shared/utils/formatPhone'
import TrackView from '@components/directorio/TrackView'
import ContactLinks from '@components/directorio/ContactLinks'

export const revalidate = 3600

export async function generateStaticParams() {
  const profiles = await profilesService.findAll()
  return profiles.map((p) => ({ slug: p.slug }))
}

type Props = { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const profile = await profilesService.getBySlug(slug)
  if (!profile) return {}
  const title = profile.business_name
  const description = profile.description ?? `${profile.business_name} — emprendedora verificada SW Mujeres.`
  return {
    title,
    description,
    openGraph: {
      title: `${title} · SW Mujeres`,
      description,
      url: `/directorio/${slug}`,
      type: 'profile',
      ...(profile.directory_image_path ? { images: [{ url: profile.directory_image_path, alt: title ?? '' }] } : {}),
    },
    twitter: { card: 'summary', title: `${title} · SW Mujeres`, description },
  }
}

function JsonLd({ profile, slug }: { profile: import('@src/features/profiles/types').DirectoryProfile; slug: string }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://swmujeres.com'
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: profile.business_name,
    description: profile.description ?? undefined,
    url: `${siteUrl}/directorio/${slug}`,
    telephone: profile.business_phone,
    ...(profile.instagram_handle ? { sameAs: [`https://instagram.com/${profile.instagram_handle}`] } : {}),
    ...(profile.website_url ? { sameAs: [profile.website_url] } : {}),
    ...(profile.directory_image_path ? { image: profile.directory_image_path } : {}),
    ...(profile.category ? { knowsAbout: profile.category } : {}),
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CO',
      ...(profile.city ? { addressLocality: profile.city } : {}),
    },
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}

const HERO_GRADIENT = 'linear-gradient(160deg,#C7A89C,#5F1F3C)'

export default async function ProfilePage({ params }: Props) {
  const { slug } = await params
  const profile = await profilesService.getBySlug(slug)
  if (!profile) notFound()

  const whatsappUrl = formatPhone(profile.business_phone)
  const founderFirstName = profile.full_name?.split(' ')[0] ?? 'ella'

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--fg)', fontFamily: 'var(--font-body)' }}>
      <JsonLd profile={profile} slug={slug} />
      <TrackView profileId={profile.id} />

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

      {/* ── Breadcrumb ───────────────────────────────────────────── */}
      <div style={{ padding: '20px 64px 0', fontSize: 12, color: 'var(--fg-2)', letterSpacing: '0.04em' }}>
        <Link href="/" style={{ color: 'var(--fg-3)' }}>Inicio</Link>
        <span style={{ margin: '0 8px', color: 'var(--fg-3)' }}>›</span>
        <Link href="/directorio" style={{ color: 'var(--fg-3)' }}>Directorio</Link>
        {profile.category && (
          <>
            <span style={{ margin: '0 8px', color: 'var(--fg-3)' }}>›</span>
            <Link href={`/directorio?categoria=${encodeURIComponent(profile.category)}`} style={{ color: 'var(--fg-3)' }}>
              {profile.category}
            </Link>
          </>
        )}
        <span style={{ margin: '0 8px', color: 'var(--fg-3)' }}>›</span>
        <span style={{ color: 'var(--accent)' }}>{profile.business_name}</span>
      </div>

      {/* ── Magazine hero ────────────────────────────────────────── */}
      <section style={{ padding: '32px 64px 0' }}>
        {profile.category && (
          <span className="sw-eyebrow">{profile.category}</span>
        )}
        <h1 style={{
          fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400,
          fontSize: 'clamp(48px, 6vw, 88px)', lineHeight: 0.98, letterSpacing: '-0.02em',
          margin: '12px 0 20px', maxWidth: 980,
        }}>
          {profile.business_name}<span style={{ color: 'var(--accent)' }}>.</span>
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 13, color: 'var(--fg-2)', flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 999,
            background: 'var(--sw-rose-pale)', color: 'var(--accent)', fontSize: 12, fontWeight: 600,
          }}>✓ Verificada por SW Mujeres</span>
          {profile.city && (
            <span>📍 {profile.city}</span>
          )}
        </div>
      </section>

      {/* ── Photo + contact sidebar ───────────────────────────────── */}
      <section style={{ padding: '32px 64px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 56, alignItems: 'start' }}>

        {/* Left: photo + about */}
        <div>
          {/* Main photo */}
          <div style={{ aspectRatio: '5/4', borderRadius: 10, overflow: 'hidden', position: 'relative', background: HERO_GRADIENT }}>
            {profile.directory_image_path && (
              <Image
                src={profile.directory_image_path}
                alt={profile.business_name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNFNkI2QzYiLz48L3N2Zz4="
              />
            )}
            {!profile.directory_image_path && (
              <div style={{ position: 'absolute', top: 18, left: 18, width: 70, height: 70, borderRadius: '50%', background: 'rgba(57,17,37,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Image src="/logo-symbol-minimal.svg" width={38} height={38} alt="" style={{ filter: 'brightness(0) invert(1)' }} />
              </div>
            )}
          </div>

          {/* Sobre */}
          {profile.description && (
            <div style={{ marginTop: 56 }}>
              <span className="sw-eyebrow">Sobre {profile.business_name}</span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400, fontSize: 36, margin: '12px 0 18px', letterSpacing: '-0.005em' }}>
                {profile.description.split('.')[0]}.
              </h2>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--fg-2)', maxWidth: 620 }}>
                {profile.description}
              </p>
            </div>
          )}

          {/* Empresaria */}
          {profile.full_name && (
            <div style={{ marginTop: 56, padding: 32, background: 'var(--bg-alt)', borderRadius: 10, border: '1px solid var(--sw-line)' }}>
              <span className="sw-eyebrow">La empresaria</span>
              <div style={{ display: 'flex', gap: 20, marginTop: 14, alignItems: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(160deg,#A98072,#3a1d22)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 26, color: 'var(--fg)' }}>{profile.full_name}</div>
                  <div style={{ fontSize: 13, color: 'var(--fg-2)', marginTop: 4 }}>Fundadora · Verificada por SW</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: sticky contact panel */}
        <aside style={{ position: 'sticky', top: 24, background: 'var(--sw-paper)', border: '1px solid var(--sw-line-strong)', borderRadius: 10, padding: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--fg-2)' }}>Contacta directo</div>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 28, marginTop: 8, lineHeight: 1.15 }}>
            Sin <span style={{ color: 'var(--accent)' }}>intermediarios.</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.6, marginTop: 12 }}>
            Habla directo con {founderFirstName} — ella responde personalmente.
          </p>

          {/* Contact actions with tracking */}
          <div style={{ marginTop: 22 }}>
            <ContactLinks
              profileId={profile.id}
              whatsappUrl={whatsappUrl}
              instagramHandle={profile.instagram_handle}
              websiteUrl={profile.website_url}
              otherSocials={profile.other_socials}
            />
          </div>

          {/* Descuento SW */}
          {profile.offers_discount && profile.discount_details && (
            <div style={{
              marginTop: 22, padding: 18, background: 'var(--sw-rose-pale)', borderRadius: 8,
              border: '1px dashed var(--accent)',
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)' }}>Descuento exclusivo SW</div>
              <div style={{ fontSize: 14, color: 'var(--bg-dark)', marginTop: 6, lineHeight: 1.5 }}>{profile.discount_details}</div>
            </div>
          )}

          {/* Meta */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--sw-line)', fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {profile.category && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Categoría</span><span style={{ color: 'var(--fg)' }}>{profile.category}</span>
              </div>
            )}
            {profile.city && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Ciudad</span><span style={{ color: 'var(--fg)' }}>{profile.city}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Estado</span><span style={{ color: '#5A7A52' }}>✓ Verificada</span>
            </div>
          </div>
        </aside>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer style={{ background: 'var(--bg-dark)', color: 'var(--fg-on-dark)', padding: '40px 64px 28px', marginTop: 80 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image src="/logo-symbol-circle-dark.svg" width={28} height={28} alt="SW" style={{ filter: 'brightness(0) invert(1)' }} />
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.22em' }}>MUJERES</span>
          </div>
          <Link href="/directorio" style={{ fontSize: 12, color: 'var(--fg-on-dark-2)' }}>← Volver al directorio</Link>
          <Link href="/inscripcion" style={{ fontSize: 12, color: 'var(--accent-soft)', fontWeight: 500 }}>Inscribir mi negocio →</Link>
        </div>
      </footer>
    </div>
  )
}
