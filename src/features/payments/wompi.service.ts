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

  const url = new URL('https://checkout.wompi.co/p/')
  url.searchParams.set('public-key', publicKey)
  url.searchParams.set('currency', 'COP')
  url.searchParams.set('amount-in-cents', String(amountCop * 100))
  url.searchParams.set('reference', reference)
  url.searchParams.set('redirect-url', redirectUrl)

  return url.toString()
}
