'use client'

import { useState } from 'react'

const darkInput: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 6,
  border: '1px solid rgba(247,239,233,0.20)',
  background: 'rgba(247,239,233,0.06)',
  color: 'var(--sw-cream)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  outline: 'none',
  width: '100%',
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--fg-on-dark-2)',
}

export default function AdminLoginPage() {
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSendCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/solicitar-acceso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (!response.ok) { setError('Ocurrió un error. Intenta de nuevo.'); return }
      setStep('code')
    } catch {
      setError('No se pudo conectar. Verifica tu conexión e intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/verificar-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      })
      if (!response.ok) {
        const data = await response.json() as { error?: string }
        setError(data.error ?? 'Código inválido o expirado.')
        return
      }
      window.location.href = '/admin'
    } catch {
      setError('No se pudo conectar. Verifica tu conexión e intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--fg-on-dark)', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <div style={{ width: 420, textAlign: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-sw-4.svg" alt="SW Mujeres" width={48} height={48} style={{ filter: 'brightness(0) invert(1)', opacity: 0.85, marginBottom: 24 }} />

        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent-soft)', marginBottom: 12 }}>
          Acceso administrativo
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400, fontSize: 44, lineHeight: 1.05, margin: '0 0 12px', letterSpacing: '-0.01em', color: 'var(--sw-cream)' }}>
          {step === 'email' ? 'Bienvenida.' : 'Tu código.'}
        </h1>

        <p style={{ fontSize: 14, color: 'var(--fg-on-dark-2)', marginBottom: 36 }}>
          {step === 'email'
            ? 'Solo personal autorizado. Cada acceso queda registrado.'
            : <>Enviamos un código de 6 dígitos a <strong style={{ color: 'var(--sw-cream)' }}>{email}</strong></>
          }
        </p>

        {step === 'email' ? (
          <form onSubmit={handleSendCode} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
            <label style={labelStyle}>Correo</label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="tu@correo.com"
              style={{ ...darkInput, opacity: loading ? 0.5 : 1 }}
            />
            {error && <p style={{ fontSize: 13, color: '#f87171', margin: 0 }}>{error}</p>}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              style={{ width: '100%', padding: '14px 24px', borderRadius: 6, background: 'var(--accent)', color: 'var(--sw-cream)', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, marginTop: 14, opacity: loading || !email.trim() ? 0.5 : 1, fontFamily: 'var(--font-body)' }}
            >
              {loading ? 'Enviando…' : 'Enviar código →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
            <label style={labelStyle}>Código de verificación</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              disabled={loading}
              placeholder="123456"
              style={{ ...darkInput, letterSpacing: '0.3em', textAlign: 'center', fontSize: 20, opacity: loading ? 0.5 : 1 }}
            />
            {error && <p style={{ fontSize: 13, color: '#f87171', margin: 0 }}>{error}</p>}
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              style={{ width: '100%', padding: '14px 24px', borderRadius: 6, background: 'var(--accent)', color: 'var(--sw-cream)', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, marginTop: 14, opacity: loading || code.length !== 6 ? 0.5 : 1, fontFamily: 'var(--font-body)' }}
            >
              {loading ? 'Verificando…' : 'Entrar →'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setCode(''); setError(null) }}
              style={{ fontSize: 13, color: 'var(--fg-on-dark-3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', marginTop: 4 }}
            >
              ← Volver
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
