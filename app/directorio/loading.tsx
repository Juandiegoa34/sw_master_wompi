export default function DirectorioLoading() {
  return (
    <div style={{ padding: '48px 64px 80px', display: 'grid', gridTemplateColumns: '240px 1fr', gap: 48 }}>
      {/* Sidebar skeleton */}
      <aside style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ height: 22, width: 80, borderRadius: 6, background: '#E9DDD8', animation: 'pulse 1.5s ease-in-out infinite' }} />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ height: 14, borderRadius: 4, background: '#F0E8E4', animation: 'pulse 1.5s ease-in-out infinite', width: `${60 + (i % 3) * 15}%` }} />
        ))}
      </aside>

      {/* Grid skeleton */}
      <div>
        <div style={{ height: 14, width: 160, borderRadius: 4, background: '#F0E8E4', marginBottom: 24, animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 28 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              style={{
                aspectRatio: '4/3',
                borderRadius: 10,
                background: '#F0E8E4',
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.07}s`,
              }}
            />
          ))}
        </div>
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
