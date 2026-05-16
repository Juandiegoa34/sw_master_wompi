/**
 * Genera la URL de checkout redirect de Wompi.
 * Solo requiere la public key — sin private key ni webhooks.
 */
export function buildWompiCheckoutUrl({
  reference,
  amountCop,
  redirectUrl,
}: {
  reference: string
  amountCop: number
  redirectUrl: string
}): string {
  const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY
  if (!publicKey) throw new Error('NEXT_PUBLIC_WOMPI_PUBLIC_KEY no está configurada.')

  let parsedRedirectUrl: URL
  try {
    parsedRedirectUrl = new URL(redirectUrl)
  } catch {
    throw new Error('La URL de redirección de Wompi no es válida.')
  }

  const isLocalhost = /^(localhost|127\.0\.0\.1|::1)$/i.test(parsedRedirectUrl.hostname)
  if (parsedRedirectUrl.protocol !== 'https:' || isLocalhost) {
    throw new Error('Wompi requiere una URL de redirección HTTPS y pública. Configura NEXT_PUBLIC_SITE_URL con tu dominio seguro (por ejemplo, un URL HTTPS de ngrok o tu dominio productivo).')
  }

  const url = new URL('https://checkout.wompi.co/p/')
  url.searchParams.set('public-key', publicKey)
  url.searchParams.set('currency', 'COP')
  url.searchParams.set('amount-in-cents', String(amountCop * 100))
  url.searchParams.set('reference', reference)
  url.searchParams.set('redirect-url', parsedRedirectUrl.toString())

  return url.toString()
}
