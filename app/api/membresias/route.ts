import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@src/shared/lib/supabase-admin'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, name, price_cop, duration_days')
    .eq('is_active', true)
    .order('price_cop', { ascending: true })

  if (error) {
    return NextResponse.json(
      { success: false, message: 'No se pudieron cargar los planes.', data: [] },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true, data: data ?? [] })
}
