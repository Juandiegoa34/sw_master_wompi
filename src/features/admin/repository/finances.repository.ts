import { supabaseAdmin } from '@src/shared/lib/supabase-admin'

export type LedgerEntry = {
  id: string
  direction: 'income' | 'expense'
  amount_cop: number
  description: string | null
  counterparty: string | null
  entry_date: string
  created_at: string
}

export type AccountSettings = {
  opening_balance_cop: number
  opening_date: string
}

export async function getLedger(fromDate?: string): Promise<LedgerEntry[]> {
  let query = supabaseAdmin
    .from('ledger_entries')
    .select('id, direction, amount_cop, description, counterparty, entry_date, created_at')
    .order('entry_date', { ascending: false })

  if (fromDate) query = query.gte('entry_date', fromDate)

  const { data, error } = await query
  if (error) throw new Error(`Error al obtener ledger: ${error.message}`)
  return (data ?? []) as LedgerEntry[]
}

export async function addEntry(entry: Omit<LedgerEntry, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
  const { error } = await supabaseAdmin
    .from('ledger_entries')
    .insert(entry)

  if (error) throw new Error(`Error al insertar entrada: ${error.message}`)
}

export type MembershipPayment = {
  id: string
  amount_cop: number
  paid_at: string
  entrepreneur_name: string | null
}

export async function getMembershipPayments(fromDate?: string): Promise<MembershipPayment[]> {
  let query = supabaseAdmin
    .from('membership_periods')
    .select('id, amount_cop, paid_at, entrepreneurs ( full_name )')
    .not('paid_at', 'is', null)
    .gt('amount_cop', 0)
    .order('paid_at', { ascending: false })

  if (fromDate) query = query.gte('paid_at', fromDate)

  const { data, error } = await query

  if (error) throw new Error(`Error al obtener pagos de membresía: ${error.message}`)

  return (data ?? []).map((row) => {
    const ent = Array.isArray(row.entrepreneurs) ? row.entrepreneurs[0] : row.entrepreneurs
    return {
      id: row.id,
      amount_cop: row.amount_cop,
      paid_at: row.paid_at as string,
      entrepreneur_name: (ent as { full_name: string | null } | null)?.full_name ?? null,
    }
  })
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('ledger_entries')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`Error al eliminar entrada: ${error.message}`)
}

export async function getAccountSettings(): Promise<AccountSettings> {
  const { data, error } = await supabaseAdmin
    .from('account_settings')
    .select('opening_balance_cop, opening_date')
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`Error al obtener configuración de cuenta: ${error.message}`)

  // Si no existe fila aún, devolver valores neutros para no romper el resumen
  return {
    opening_balance_cop: data?.opening_balance_cop ?? 0,
    opening_date: data?.opening_date ?? new Date().toISOString().split('T')[0],
  }
}
