'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Status = 'loading' | 'success' | 'error'

function ConfirmacionContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<Status>('loading')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    async function processPayment() {
      // Wompi redirige con ?id=<transaction_id>&... y añadimos ?applicationId=<id>
      const wompiTransactionId = searchParams.get('id')
      const wompiStatus = searchParams.get('approval_status') ?? 'completed'
      const applicationId = searchParams.get('applicationId')

      if (!applicationId || !wompiTransactionId) {
        setErrorMsg('No se pudo identificar la aplicación o la transacción. Por favor inicia el proceso de nuevo o contacta soporte.')
        setStatus('error')
        return
      }

      try {
        const res = await fetch('/api/payments/wompi/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicationId, wompi_reference: wompiTransactionId, wompi_status: wompiStatus }),
        })
        const json = await res.json() as { success: boolean; message: string }

        if (json.success) {
          setStatus('success')
        } else {
          setErrorMsg(json.message ?? 'Ocurrió un error al guardar tu solicitud.')
          setStatus('error')
        }
      } catch {
        setErrorMsg('Error de conexión. Tu pago fue procesado pero no pudimos actualizar tu solicitud. Por favor contáctanos.')
        setStatus('error')
      }
    }

    processPayment()
  }, [searchParams])

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-[--bg] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div
            className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mx-auto"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
          />
          <p className="text-[--fg-2] text-sm">Procesando tu pago…</p>
        </div>
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main className="min-h-screen bg-[--bg] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center space-y-5">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto text-xl text-sw-cream"
            style={{ background: 'var(--sw-burgundy)' }}
          >
            !
          </div>
          <h1 className="sw-display sw-h2 text-[--fg]">Algo salió mal</h1>
          <p className="text-[--fg-2] leading-relaxed text-sm">
            {errorMsg}
          </p>
          <Link
            href="/inscripcion"
            className="inline-block px-6 py-2.5 text-sm font-semibold rounded-lg text-sw-cream"
            style={{ background: 'var(--accent)' }}
          >
            Volver al formulario
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[--bg] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-5">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto text-xl text-sw-cream"
          style={{ background: 'var(--accent)' }}
        >
          ✓
        </div>
        <h1 className="sw-display sw-h2 text-[--fg]">¡Pago recibido!</h1>
        <p className="text-[--fg-2] leading-relaxed text-sm">
          Tu solicitud está siendo revisada. Te contactaremos en los próximos días.
          Estamos emocionadas de conocer tu emprendimiento.
        </p>
        <Link
          href="/directorio"
          className="inline-block px-6 py-2.5 text-sm font-semibold rounded-lg text-sw-cream"
          style={{ background: 'var(--accent)' }}
        >
          Ver el directorio
        </Link>
      </div>
    </main>
  )
}

export default function ConfirmacionPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[--bg] flex items-center justify-center px-4">
          <div className="text-center space-y-4">
            <div
              className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mx-auto"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
            />
            <p className="text-[--fg-2] text-sm">Procesando tu pago…</p>
          </div>
        </main>
      }
    >
      <ConfirmacionContent />
    </Suspense>
  )
}
