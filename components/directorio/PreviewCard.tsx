'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { DirectoryProfile } from '@src/features/profiles/types'

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max).trimEnd() + '…'
}

// 1×1 SVG in rose-pale (#E6B6C6) used as blur placeholder for remote images
const BLUR_DATA_URL = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNFNkI2QzYiLz48L3N2Zz4='

const CARD_GRADIENTS = [
  'linear-gradient(160deg,#C7A89C,#5F1F3C)',
  'linear-gradient(160deg,#A98072,#3a1d22)',
  'linear-gradient(160deg,#E7B1A5,#5F1F3C)',
  'linear-gradient(160deg,#E6B6C6,#821641)',
  'linear-gradient(160deg,#A1726B,#4a1a2a)',
  'linear-gradient(160deg,#B5917F,#4a1a2a)',
  'linear-gradient(160deg,#C7A89C,#391125)',
  'linear-gradient(160deg,#8E6B5F,#391125)',
]


interface PreviewCardProps {
  profile: DirectoryProfile
  idx: number
  videoSrc?: string
  descMaxLen?: number
}

export default function PreviewCard({ profile, idx, videoSrc, descMaxLen = 72 }: PreviewCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const baseHeightRef = useRef<number | null>(null)
  const [isRowExpanded, setIsRowExpanded] = useState(false)

  const handleMouseEnter = () => videoRef.current?.play().catch(() => {})
  const handleMouseLeave = () => {
    const v = videoRef.current
    if (!v) return
    v.pause()
    v.currentTime = 0
  }

  const gradient = CARD_GRADIENTS[idx % CARD_GRADIENTS.length]
  const description = profile.description ?? ''
  const visibleDescription = isRowExpanded ? description : truncate(description, descMaxLen)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const observer = new ResizeObserver(([entry]) => {
      const height = entry.contentRect.height
      if (baseHeightRef.current === null || height < baseHeightRef.current) {
        baseHeightRef.current = height
      }

      setIsRowExpanded(height > baseHeightRef.current + 24)
    })

    observer.observe(card)
    return () => observer.disconnect()
  }, [])

  return (
    <Link
        ref={cardRef}
        href={`/directorio/${profile.slug}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={videoSrc ? 'swpc swpc-has-video' : 'swpc'}
        style={{
          background: 'var(--sw-paper)',
          borderRadius: 10,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Media block */}
        <div
          className="swpc-media"
          style={{ position: 'relative', background: profile.directory_image_path ? undefined : gradient, overflow: 'hidden' }}
        >
          {profile.directory_image_path && (
            <Image
              src={profile.directory_image_path}
              alt={profile.business_name}
              fill
              className="swpc-img object-cover"
              sizes="(max-width: 768px) 100vw, 25vw"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
            />
          )}

          {videoSrc && (
            <video
              ref={videoRef}
              src={videoSrc}
              muted
              playsInline
              loop
              preload="none"
              className="swpc-video"
            />
          )}

          <span style={{
            position: 'absolute', top: 12, right: 12,
            padding: '5px 10px', borderRadius: 999,
            background: 'rgba(247,239,233,0.92)',
            color: 'var(--accent)', fontSize: 11, fontWeight: 600,
            zIndex: 1,
          }}>✓ Verificada</span>
          <div style={{
            position: 'absolute', top: 12, left: 12,
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(57,17,37,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1,
          }}>
            <Image src="/logo-symbol-minimal.svg" width={18} height={18} alt="" style={{ filter: 'brightness(0) invert(1)' }} />
          </div>
        </div>

        {/* Body */}
        <div className="swpc-body">
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', color: 'var(--accent)', textTransform: 'uppercase' }}>
            {profile.category ?? '—'}
          </div>
          <div style={{
            fontFamily: 'var(--font-display)', fontStyle: 'italic',
            fontSize: 22, color: 'var(--fg)', margin: '4px 0 6px', letterSpacing: '-0.005em', lineHeight: 1.15,
          }}>
            {profile.business_name}
          </div>
          {visibleDescription && (
            <div className="swpc-desc" style={{ fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.55 }}>{visibleDescription}</div>
          )}
          {profile.city && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--fg-3)' }}>{profile.city}</div>
          )}
        </div>
      </Link>
  )
}
