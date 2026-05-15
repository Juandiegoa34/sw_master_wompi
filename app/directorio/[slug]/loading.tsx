export default function ProfileLoading() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--sw-paper, #F7EFE9)' }}>
      {/* Hero */}
      <div style={{ height: 360, background: '#E9DDD8', animation: 'pulse 1.5s ease-in-out infinite' }} />

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ height: 32, width: '55%', borderRadius: 6, background: '#E9DDD8', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: 14, width: '30%', borderRadius: 4, background: '#F0E8E4', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: 14, borderRadius: 4, background: '#F0E8E4', animation: 'pulse 1.5s ease-in-out infinite', width: `${85 + (i % 2) * 10}%` }} />
          ))}
        </div>
        <div style={{ height: 44, width: 180, borderRadius: 999, background: '#E9DDD8', marginTop: 16, animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
