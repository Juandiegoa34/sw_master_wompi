'use client'

import type { FullStats, TimeSeriesPoint } from '@src/features/tracking/types'

// ─── Descarga CSV ─────────────────────────────────────────────────────────────

function buildCSV(stats: FullStats): string {
  const today = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const rows: string[] = [
    `Estadísticas de ${stats.businessName}`,
    `Generado el,${today}`,
    '',
    'Resumen',
    `Vistas totales,${stats.views}`,
    `Clicks WhatsApp,${stats.clicks.whatsapp}`,
    `Clicks Instagram,${stats.clicks.instagram}`,
    `Clicks Sitio Web,${stats.clicks.website}`,
    `Total clicks,${stats.clicks.total}`,
    `Promedio del directorio - vistas,${stats.averages.avgViews}`,
    `Promedio del directorio - clicks,${stats.averages.avgClicks}`,
    '',
    'Detalle por día (últimos 30 días)',
    'Fecha,Vistas,Clicks',
    ...stats.timeSeries.map((p) => `${p.date},${p.views},${p.clicks}`),
  ]

  return rows.join('\n')
}

function downloadCSV(stats: FullStats) {
  const csv = buildCSV(stats)
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const slug = stats.businessName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  a.href = url
  a.download = `estadisticas-${slug}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Gráfica de líneas (SVG puro) ─────────────────────────────────────────────

function LineChart({ data }: { data: TimeSeriesPoint[] }) {
  if (data.length < 2) return null

  const W = 600
  const H = 160
  const padX = 8
  const padY = 12
  const chartW = W - padX * 2
  const chartH = H - padY * 2

  const maxVal = Math.max(...data.map((d) => Math.max(d.views, d.clicks)), 1)
  const xStep = chartW / (data.length - 1)

  const toX = (i: number) => padX + i * xStep
  const toY = (v: number) => padY + chartH - (v / maxVal) * chartH

  const viewsPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(d.views).toFixed(1)}`)
    .join(' ')

  const clicksPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(d.clicks).toFixed(1)}`)
    .join(' ')

  // Etiquetas del eje X: primer día, día 15 y último
  const labelIndices = [0, Math.floor(data.length / 2), data.length - 1]

  return (
    <svg
      viewBox={`0 0 ${W} ${H + 20}`}
      className="w-full"
      aria-label="Gráfica de vistas y clicks por día"
    >
      {/* Línea de base */}
      <line
        x1={padX}
        y1={padY + chartH}
        x2={W - padX}
        y2={padY + chartH}
        stroke="#e5e7eb"
        strokeWidth="1"
      />

      {/* Líneas de referencia (3 guías horizontales) */}
      {[0.5, 1].map((frac) => (
        <line
          key={frac}
          x1={padX}
          y1={padY + chartH - frac * chartH}
          x2={W - padX}
          y2={padY + chartH - frac * chartH}
          stroke="#f3f4f6"
          strokeWidth="1"
        />
      ))}

      {/* Serie: vistas */}
      <path d={viewsPath} fill="none" stroke="#ec4899" strokeWidth="2.5" strokeLinejoin="round" />

      {/* Serie: clicks */}
      <path d={clicksPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinejoin="round" />

      {/* Etiquetas eje X */}
      {labelIndices.map((i) => (
        <text
          key={i}
          x={toX(i)}
          y={H + 14}
          textAnchor="middle"
          fontSize="11"
          fill="#9ca3af"
        >
          {data[i].date.slice(5)} {/* MM-DD */}
        </text>
      ))}
    </svg>
  )
}

// ─── Tarjeta de métrica ────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sublabel,
  accent,
}: {
  label: string
  value: number
  sublabel?: string
  accent?: string
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accent ?? 'text-gray-900'}`}>
        {value.toLocaleString('es-CO')}
      </p>
      {sublabel && <p className="mt-0.5 text-xs text-gray-400">{sublabel}</p>}
    </div>
  )
}

// ─── Barra de comparación con el directorio ───────────────────────────────────

function ComparisonBar({
  label,
  myValue,
  avgValue,
}: {
  label: string
  myValue: number
  avgValue: number
}) {
  const max = Math.max(myValue, avgValue, 1)
  const myPct = Math.round((myValue / max) * 100)
  const avgPct = Math.round((avgValue / max) * 100)

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-gray-700">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <span className="w-20 text-right text-xs text-gray-400">Tu perfil</span>
          <div className="flex-1 rounded-full bg-gray-100 h-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-pink-400 transition-all"
              style={{ width: `${myPct}%` }}
            />
          </div>
          <span className="w-8 text-xs font-semibold text-gray-700">{myValue}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-20 text-right text-xs text-gray-400">Promedio SW</span>
          <div className="flex-1 rounded-full bg-gray-100 h-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-gray-300 transition-all"
              style={{ width: `${avgPct}%` }}
            />
          </div>
          <span className="w-8 text-xs font-semibold text-gray-400">{avgValue}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Vista principal ───────────────────────────────────────────────────────────

export default function StatsView({ stats }: { stats: FullStats }) {
  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-pink-500">
            Estadísticas
          </p>
          <h1 className="mt-0.5 text-2xl font-bold text-gray-900">{stats.businessName}</h1>
          <p className="mt-1 text-sm text-gray-400">Últimos 30 días</p>
        </div>

        <button
          onClick={() => downloadCSV(stats)}
          className="flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95"
          aria-label="Descargar estadísticas como CSV"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4 text-gray-500"
            aria-hidden="true"
          >
            <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
            <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
          </svg>
          Descargar
        </button>
      </div>

      {/* Métricas resumen */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Vistas" value={stats.views} sublabel="visitas al perfil" />
        <MetricCard
          label="WhatsApp"
          value={stats.clicks.whatsapp}
          sublabel="clicks"
          accent="text-green-600"
        />
        <MetricCard
          label="Instagram"
          value={stats.clicks.instagram}
          sublabel="clicks"
          accent="text-purple-600"
        />
        <MetricCard
          label="Sitio web"
          value={stats.clicks.website}
          sublabel="clicks"
          accent="text-blue-600"
        />
      </div>

      {/* Gráfica */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">Actividad diaria</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-full bg-pink-400 inline-block" />
              Vistas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-full bg-green-400 inline-block" />
              Clicks
            </span>
          </div>
        </div>
        <LineChart data={stats.timeSeries} />
      </div>

      {/* Comparativa con el directorio */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-gray-700">
          Tu perfil vs. promedio SW
        </p>
        <div className="space-y-4">
          <ComparisonBar
            label="Vistas totales"
            myValue={stats.views}
            avgValue={stats.averages.avgViews}
          />
          <ComparisonBar
            label="Clicks totales"
            myValue={stats.clicks.total}
            avgValue={stats.averages.avgClicks}
          />
        </div>
      </div>

      {/* Pie */}
      <p className="text-center text-xs text-gray-300">
        Esta página es privada — solo tú tienes este enlace.
      </p>
    </div>
  )
}
