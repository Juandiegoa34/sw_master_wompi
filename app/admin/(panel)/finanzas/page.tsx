'use client'

// Página de finanzas del panel admin.
// Muestra: 3 tarjetas de resumen, formulario de nueva entrada manual, y el ledger
// agrupado por mes combinando ledger_entries (egresos + entradas manuales) y
// membership_periods (pagos de membresía). Las entradas de membresía no se pueden
// eliminar desde acá — son de solo lectura.

import { useEffect, useState, useCallback } from 'react'

// ─── Tipos locales ────────────────────────────────────────────────────────────

type FinancialEntry = {
  id: string
  source: 'ledger' | 'membership'
  direction: 'income' | 'expense'
  amount_cop: number
  description: string
  counterparty: string | null
  date: string
}

type FinancesSummary = {
  openingBalance: number
  openingDate: string
  totalIngresos: number
  totalEgresos: number
  balance: number
}

type MonthlyGroup = {
  month: string
  label: string
  ingresos: number
  egresos: number
  entries: FinancialEntry[]
}

type FinancesData = {
  summary: FinancesSummary
  monthlyGroups: MonthlyGroup[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Tarjeta de resumen ───────────────────────────────────────────────────────

function SummaryCard({
  label,
  amount,
  color,
  sub,
}: {
  label: string
  amount: number
  color: 'green' | 'red' | 'blue'
  sub?: string
}) {
  const textColor = color === 'green' ? '#3a6b35' : color === 'red' ? '#dc2626' : 'var(--fg)'
  return (
    <div style={{ background: 'var(--sw-paper)', border: '1px solid var(--sw-line)', borderRadius: 10, padding: '22px 24px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-2)' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 36, color: textColor, lineHeight: 1, marginTop: 12 }}>{formatCOP(amount)}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 8 }}>{sub}</div>}
    </div>
  )
}

// ─── Formulario de nueva entrada manual ──────────────────────────────────────

function NewEntryForm({ onSuccess }: { onSuccess: () => void }) {
  const [direction, setDirection] = useState<'income' | 'expense'>('income')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [counterparty, setCounterparty] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const parsed = parseFloat(amount.replace(/\./g, '').replace(',', '.'))
    if (!parsed || parsed <= 0) {
      setError('Ingresa un monto válido mayor a 0')
      return
    }
    if (!description.trim()) {
      setError('La descripción es obligatoria')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/finanzas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direction,
          amount_cop: parsed,
          description: description.trim(),
          counterparty: counterparty.trim() || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Error al guardar')
        return
      }
      setAmount('')
      setDescription('')
      setCounterparty('')
      onSuccess()
    } catch {
      setError('Error de red. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full rounded-lg px-3 py-2 text-sm text-sw-negro placeholder-sw-fg3 focus:outline-none focus:ring-2 focus:ring-sw-burgundy"
  const inputStyle = { border: '1px solid var(--sw-line-strong)' }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-sw-paper p-5" style={{ border: '1px solid var(--sw-line)' }}>
      <h2 className="mb-4 text-base font-semibold text-sw-negro">Nueva entrada manual</h2>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-sw-fg2">Tipo</label>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as 'income' | 'expense')}
            className={inputCls}
            style={inputStyle}
          >
            <option value="income">Ingreso</option>
            <option value="expense">Egreso</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-sw-fg2">Monto (COP)</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Ej: 50000"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
            className={inputCls}
            style={inputStyle}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-sw-fg2">Contraparte</label>
          <input
            type="text"
            placeholder="Quién pagó / a quién"
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value)}
            maxLength={200}
            className={inputCls}
            style={inputStyle}
          />
        </div>

        <div className="sm:col-span-3">
          <label className="mb-1 block text-sm font-medium text-sw-fg2">Descripción</label>
          <input
            type="text"
            placeholder="Ej: Dominio anual, Micrófono…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
            className={inputCls}
            style={inputStyle}
          />
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-sw-burgundy px-5 py-2 text-sm font-medium text-sw-paper hover:bg-sw-burgundy-dark disabled:opacity-50 transition-colors"
        >
          {saving ? 'Guardando…' : 'Guardar entrada'}
        </button>
      </div>
    </form>
  )
}

// ─── Fila del ledger ──────────────────────────────────────────────────────────

function EntryRow({
  entry,
  onDelete,
}: {
  entry: FinancialEntry
  onDelete: (id: string) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/finanzas/${entry.id}`, { method: 'DELETE' })
      if (res.ok) onDelete(entry.id)
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <tr className="border-b text-sm hover:bg-sw-cream transition-colors" style={{ borderColor: 'var(--sw-line)' }}>
      <td className="py-3 pr-4 text-sw-fg3">{formatDate(entry.date)}</td>
      <td className="py-3 pr-4">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            entry.direction === 'income'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {entry.direction === 'income' ? '▲ Ingreso' : '▼ Egreso'}
        </span>
        {entry.source === 'membership' && (
          <span className="ml-1 inline-flex items-center rounded-full bg-sw-blush-mist px-2 py-0.5 text-xs text-sw-burgundy">
            membresía
          </span>
        )}
      </td>
      <td className="py-3 pr-4 text-sw-fg2">
        {entry.counterparty && (
          <span className="font-medium">{entry.counterparty}</span>
        )}
        {entry.counterparty && entry.description && (
          <span className="text-sw-fg3"> · </span>
        )}
        {entry.description}
      </td>
      <td
        className={`py-3 pr-4 text-right font-medium tabular-nums ${
          entry.direction === 'income' ? 'text-green-700' : 'text-red-600'
        }`}
      >
        {entry.direction === 'income' ? '+' : '−'} {formatCOP(entry.amount_cop)}
      </td>
      <td className="py-3 text-right">
        {entry.source === 'ledger' ? (
          confirming ? (
            <span className="inline-flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs text-red-600 hover:underline disabled:opacity-50"
              >
                {deleting ? 'Eliminando…' : 'Confirmar'}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="text-xs text-sw-fg3 hover:underline"
              >
                Cancelar
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="text-xs text-sw-fg3 hover:text-red-500"
            >
              Eliminar
            </button>
          )
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </td>
    </tr>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AdminFinanzasPage() {
  const [data, setData] = useState<FinancesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/finanzas')
      if (!res.ok) throw new Error('Error al cargar datos')
      const json = await res.json()
      setData(json as FinancesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function handleEntryDeleted(id: string) {
    if (!data) return
    const updatedGroups = data.monthlyGroups
      .map((g) => ({
        ...g,
        entries: g.entries.filter((e) => e.id !== id),
      }))
      .filter((g) => g.entries.length > 0)

    // Recalcular resumen
    const allEntries = updatedGroups.flatMap((g) => g.entries)
    const totalIngresos = allEntries.filter((e) => e.direction === 'income').reduce((s, e) => s + e.amount_cop, 0)
    const totalEgresos = allEntries.filter((e) => e.direction === 'expense').reduce((s, e) => s + e.amount_cop, 0)

    setData({
      ...data,
      monthlyGroups: updatedGroups,
      summary: {
        ...data.summary,
        totalIngresos,
        totalEgresos,
        balance: data.summary.openingBalance + totalIngresos - totalEgresos,
      },
    })
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sw-fg3 text-sm">
        Cargando finanzas…
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 text-sm">
        {error ?? 'No se pudieron cargar los datos.'}
      </div>
    )
  }

  const { summary, monthlyGroups } = data

  return (
    <div>
      {/* AdminHeader */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, paddingBottom: 20, borderBottom: '1px solid var(--sw-line)' }}>
        <div>
          <div className="sw-eyebrow">Admin</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400, fontSize: 38, margin: '8px 0 4px', letterSpacing: '-0.005em', color: 'var(--fg)' }}>
            Finanzas
          </h1>
        </div>
      </div>
      <div className="space-y-8">

      {/* ── Tarjetas de resumen ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Total ingresos" amount={summary.totalIngresos} color="green" />
        <SummaryCard label="Total egresos" amount={summary.totalEgresos} color="red" />
        <SummaryCard
          label="Balance actual"
          amount={summary.balance}
          color="blue"
          sub={`Saldo inicial: ${formatCOP(summary.openingBalance)} · desde ${formatDate(summary.openingDate)}`}
        />
      </div>

      {/* ── Formulario ── */}
      <NewEntryForm onSuccess={fetchData} />

      {/* ── Ledger por mes ── */}
      {monthlyGroups.length === 0 ? (
        <p className="text-sm text-sw-fg3">No hay entradas registradas aún.</p>
      ) : (
        monthlyGroups.map((group) => (
          <div key={group.month} className="rounded-xl bg-sw-paper" style={{ border: '1px solid var(--sw-line)' }}>
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--sw-line)' }}>
              <span className="font-semibold text-sw-negro">{group.label}</span>
              <span className="text-sm text-sw-fg3">
                <span className="text-green-600 font-medium">+{formatCOP(group.ingresos)}</span>
                {' · '}
                <span className="text-red-500 font-medium">−{formatCOP(group.egresos)}</span>
              </span>
            </div>

            <div className="overflow-x-auto px-5">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium uppercase tracking-wide text-sw-fg3">
                    <th className="pb-2 pt-4 pr-4">Fecha</th>
                    <th className="pb-2 pt-4 pr-4">Tipo</th>
                    <th className="pb-2 pt-4 pr-4">Descripción</th>
                    <th className="pb-2 pt-4 pr-4 text-right">Monto</th>
                    <th className="pb-2 pt-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {group.entries.map((entry) => (
                    <EntryRow key={entry.id} entry={entry} onDelete={handleEntryDeleted} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="h-3" />
          </div>
        ))
      )}
    </div>
    </div>
  )
}
