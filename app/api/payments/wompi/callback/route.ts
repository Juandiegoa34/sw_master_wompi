import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@src/shared/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const applicationId = String(body.applicationId || body.reference || '')
    const wompiReference = String(body.wompi_reference || body.wompiReference || body.id || '')
    const wompiStatus = String(body.wompi_status || body.wompiStatus || body.approval_status || 'completed')
    const paymentCompletedAt = body.payment_completed_at || new Date().toISOString()

    if (!applicationId || !wompiReference) {
      return NextResponse.json({ success: false, message: 'applicationId y wompi_reference requeridos' }, { status: 400 })
    }

    // 1) Actualizar applications con referencia y estado
    const { error: errApp } = await supabaseAdmin
      .from('applications')
      .update({ wompi_reference: wompiReference, wompi_status: wompiStatus, payment_completed_at: paymentCompletedAt, status: 'aprobado' })
      .eq('id', applicationId)

    if (errApp) {
      return NextResponse.json({ success: false, message: errApp.message }, { status: 500 })
    }

    // 2) Marcar payment_transactions como paid (si existe)
    const now = new Date().toISOString()
    const { error: errTx } = await supabaseAdmin
      .from('payment_transactions')
      .update({ status: 'paid', paid_at: now, raw_provider_payload: body })
      .eq('application_id', applicationId)

    if (errTx) {
      // continuar aunque falle la actualización de transacción
    }

    // 3) Recuperar datos de la aplicación para crear/actualizar membership y membership_period
    const { data: appRow, error: errGetApp } = await supabaseAdmin
      .from('applications')
      .select('id, entrepreneur_id, product_id, amount_cop')
      .eq('id', applicationId)
      .maybeSingle()

    if (errGetApp || !appRow) {
      return NextResponse.json({ success: false, message: 'No se encontró la aplicación.' }, { status: 500 })
    }

    const entrepreneurId = appRow.entrepreneur_id
    const productId = appRow.product_id
    const amountCop = appRow.amount_cop

    // Obtener duración del producto
    const { data: productRow } = await supabaseAdmin
      .from('products')
      .select('duration_days')
      .eq('id', productId)
      .maybeSingle()

    const durationDays = (productRow && productRow.duration_days) ?? 30
    const startAt = now
    const endAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()

    // 4) Upsert membership
    const { data: existingMembership } = await supabaseAdmin
      .from('memberships')
      .select('id')
      .eq('entrepreneur_id', entrepreneurId)
      .maybeSingle()

    if (existingMembership && existingMembership.id) {
      await supabaseAdmin
        .from('memberships')
        .update({ status: 'active', start_at: startAt, end_at: endAt, last_application_id: applicationId })
        .eq('id', existingMembership.id)
    } else {
      await supabaseAdmin
        .from('memberships')
        .insert({ entrepreneur_id: entrepreneurId, status: 'active', start_at: startAt, end_at: endAt, last_application_id: applicationId })
    }

    // 5) Crear membership_periods
    await supabaseAdmin.from('membership_periods').insert({
      entrepreneur_id: entrepreneurId,
      application_id: applicationId,
      start_at: startAt,
      end_at: endAt,
      amount_cop: amountCop,
      paid_at: now,
    })

    return NextResponse.json({ success: true, message: 'Aplicación y membresía actualizadas por pago.' })
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Error procesando callback.' }, { status: 500 })
  }
}
