'use client'

interface ContactLinksProps {
  profileId: string
  whatsappUrl: string
  instagramHandle?: string | null
  websiteUrl?: string | null
  otherSocials?: string | null
}

function recordClick(profileId: string, type: 'whatsapp' | 'instagram' | 'website') {
  fetch('/api/tracking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId, type }),
  }).catch(() => {
    // Silencioso — el tracking no debe bloquear la navegación
  })
}

export default function ContactLinks({
  profileId,
  whatsappUrl,
  instagramHandle,
  websiteUrl,
  otherSocials,
}: ContactLinksProps) {
  return (
    <div className="mt-8 flex flex-col gap-3">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => recordClick(profileId, 'whatsapp')}
        className="flex items-center justify-center gap-2 rounded-xl bg-green-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-600 active:scale-95"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.477 2 12c0 1.9.526 3.676 1.441 5.192L2 22l4.961-1.408A9.954 9.954 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.952 7.952 0 0 1-4.34-1.284l-.31-.194-3.22.914.881-3.114-.214-.328A7.952 7.952 0 0 1 4 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8z"
            clipRule="evenodd"
          />
        </svg>
        Contactar por WhatsApp
      </a>

      {instagramHandle && (
        <a
          href={`https://instagram.com/${instagramHandle}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => recordClick(profileId, 'instagram')}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95"
        >
          Instagram · @{instagramHandle}
        </a>
      )}

      {websiteUrl && (
        <a
          href={websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => recordClick(profileId, 'website')}
          className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95"
        >
          {websiteUrl}
        </a>
      )}

      {otherSocials && (
        <p className="mt-1 text-center text-sm text-gray-500">{otherSocials}</p>
      )}
    </div>
  )
}
