import { createHmac } from 'crypto'

/**
 * Genera la URL de checkout redirect de Wompi con firma de integridad.
 * Requiere NEXT_PUBLIC_WOMPI_PUBLIC_KEY y WOMPI_PRIVATE_KEY en variables de entorno.
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
  const privateKey = process.env.WOMPI_PRIVATE_KEY

  if (!publicKey) throw new Error('NEXT_PUBLIC_WOMPI_PUBLIC_KEY no está configurada.')
  if (!privateKey) throw new Error('WOMPI_PRIVATE_KEY no está configurada. Obtén tu clave privada desde el dashboard de Wompi.')

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

  const amountInCents = String(amountCop * 100)
  const currency = 'COP'

  // Calcular firma de integridad: HMAC-SHA256 de: reference + amountInCents + currency + redirectUrl
  // Orden importa: reference, amount_in_cents, currency, redirect_url
  const integrityString = `${reference}${amountInCents}${currency}${parsedRedirectUrl.toString()}`
  const signature = createHmac('sha256', privateKey).update(integrityString).digest('hex')

  const url = new URL('https://checkout.wompi.co/p/')
  url.searchParams.set('public-key', publicKey)
  url.searchParams.set('currency', currency)
  url.searchParams.set('amount-in-cents', amountInCents)
  url.searchParams.set('reference', reference)
  url.searchParams.set('redirect-url', parsedRedirectUrl.toString())
  url.searchParams.set('integrity', signature)

  return url.toString()
}
