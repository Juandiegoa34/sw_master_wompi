import {
  getLedger,
  addEntry,
  deleteEntry,
  getAccountSettings,
  getMembershipPayments,
  type LedgerEntry,
  type AccountSettings,
  type MembershipPayment,
} from '../repository/finances.repository'

// Entrada unificada que puede venir de ledger_entries o membership_periods
export type FinancialEntry = {
  id: string
  source: 'ledger' | 'membership'
  direction: 'income' | 'expense'
  amount_cop: number
  description: string
  counterparty: string | null
  date: string   // ISO date string para ordenar y agrupar
}

export type FinancesSummary = {
  openingBalance: number
  openingDate: string
  totalIngresos: number
  totalEgresos: number
  balance: number
}

export type MonthlyGroup = {
  month: string   // "YYYY-MM"
  label: string   // "Enero 2025"
  ingresos: number
  egresos: number
  entries: FinancialEntry[]
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function toFinancialEntries(
  ledger: LedgerEntry[],
  memberships: MembershipPayment[]
): FinancialEntry[] {
  const fromLedger: FinancialEntry[] = ledger.map((e) => ({
    id: e.id,
    source: 'ledger',
    direction: e.direction,
    amount_cop: e.amount_cop,
    description: e.description ?? 'Sin descripción',
    counterparty: e.counterparty,
    date: e.entry_date,
  }))

  const fromMemberships: FinancialEntry[] = memberships.map((m) => ({
    id: m.id,
    source: 'membership',
    direction: 'income',
    amount_cop: m.amount_cop,
    description: 'Pago membresía',
    counterparty: m.entrepreneur_name,
    date: m.paid_at.split('T')[0],
  }))

  return [...fromLedger, ...fromMemberships].sort((a, b) =>
    b.date.localeCompare(a.date)
  )
}

export const financesService = {
  async addEntry(entry: Omit<LedgerEntry, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    return addEntry(entry)
  },

  async deleteEntry(id: string): Promise<void> {
    return deleteEntry(id)
  },

  async getAccountSettings(): Promise<AccountSettings> {
    return getAccountSettings()
  },

  async getFullSummary(): Promise<FinancesSummary> {
    const settings = await getAccountSettings()
    const fromDate = settings.opening_date
    const [ledger, memberships] = await Promise.all([
      getLedger(fromDate),
      getMembershipPayments(fromDate),
    ])
    const entries = toFinancialEntries(ledger, memberships)
    const totalIngresos = entries
      .filter((e) => e.direction === 'income')
      .reduce((sum, e) => sum + e.amount_cop, 0)
    const totalEgresos = entries
      .filter((e) => e.direction === 'expense')
      .reduce((sum, e) => sum + e.amount_cop, 0)
    return {
      openingBalance: settings.opening_balance_cop,
      openingDate: settings.opening_date,
      totalIngresos,
      totalEgresos,
      balance: settings.opening_balance_cop + totalIngresos - totalEgresos,
    }
  },

  async getMonthlyGroups(): Promise<MonthlyGroup[]> {
    const settings = await getAccountSettings()
    const fromDate = settings.opening_date
    const [ledger, memberships] = await Promise.all([
      getLedger(fromDate),
      getMembershipPayments(fromDate),
    ])
    const entries = toFinancialEntries(ledger, memberships)
    const map = new Map<string, MonthlyGroup>()

    for (const entry of entries) {
      const d = new Date(entry.date + 'T12:00:00')
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!map.has(month)) {
        map.set(month, {
          month,
          label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
          ingresos: 0,
          egresos: 0,
          entries: [],
        })
      }
      const group = map.get(month)!
      group.entries.push(entry)
      if (entry.direction === 'income') group.ingresos += entry.amount_cop
      else group.egresos += entry.amount_cop
    }

    return Array.from(map.values()).sort((a, b) => b.month.localeCompare(a.month))
  },
}
