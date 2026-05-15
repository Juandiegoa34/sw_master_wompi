#!/usr/bin/env node

/**
 * Script para crear datos de prueba para el flujo completo de pagos con Wompi
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mytfhahvpysnszzxzjdd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15dGZoYWh2cHlzbnN6enh6amRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTczNzEwMywiZXhwIjoyMDkxMzEzMTAzfQ.9finSw8d7gAQtXcguILMuFhJCPWYY5WpmNnLR7MtnwQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestData() {
  try {
    console.log('🚀 Creando datos de prueba para el flujo de pagos...\n');

    // 1. Crear o buscar un entrepreneur
    console.log('1️⃣ Buscando/creando entrepreneur...');
    const testCedula = '9876543210'; // Cédula única para cada ejecución
    const { data: entrepreneurs, error: eError } = await supabase
      .from('entrepreneurs')
      .select('id')
      .eq('cedula', testCedula)
      .limit(1);

    if (eError) throw eError;

    let entrepreneurId;
    if (entrepreneurs && entrepreneurs.length > 0) {
      entrepreneurId = entrepreneurs[0].id;
      console.log(`   ✅ Entrepreneur existente: ${entrepreneurId}`);
    } else {
      const { data: newE, error: createError } = await supabase
        .from('entrepreneurs')
        .insert({
          cedula: testCedula,
          full_name: 'María Prueba Wompi',
          email: 'test.wompi@example.com',
          phone: '+573001234567',
        })
        .select()
        .single();

      if (createError) throw createError;
      entrepreneurId = newE.id;
      console.log(`   ✅ Nuevo entrepreneur creado: ${entrepreneurId}`);
    }

    // 2. Buscar o crear un product
    console.log('\n2️⃣ Buscando/creando product...');
    const { data: products, error: pError } = await supabase
      .from('products')
      .select('id, type')
      .limit(1);

    if (pError) throw pError;

    let productId;
    if (products && products.length > 0) {
      productId = products[0].id;
      console.log(`   ✅ Product existente: ${productId} (type: ${products[0].type})`);
    } else {
      console.log('   ⚠️  No hay productos disponibles');
      console.log('   Por favor, crea un producto en Supabase primero');
      process.exit(1);
    }

    // 3. Crear una application
    console.log('\n3️⃣ Creando application...');
    const { data: newApp, error: appError } = await supabase
      .from('applications')
      .insert({
        entrepreneur_id: entrepreneurId,
        product_id: productId,
        amount_cop: 50000,
        status: 'pendiente',
        receipt_path: 'test-receipt-' + Date.now(),
      })
      .select()
      .single();

    if (appError) throw appError;
    const applicationId = newApp.id;
    console.log(`   ✅ Application creada: ${applicationId}`);

    // 4. Mostrar resumen
    console.log('\n' + '='.repeat(60));
    console.log('✨ DATOS DE PRUEBA CREADOS EXITOSAMENTE\n');
    console.log('📊 RESUMEN:');
    console.log(`   Entrepreneur ID: ${entrepreneurId}`);
    console.log(`   Product ID:      ${productId}`);
    console.log(`   Application ID:  ${applicationId}`);
    console.log(`   Monto:           COP 50,000`);
    console.log(`   Email:           test.wompi@example.com`);
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Usa esta Application ID en el callback de Wompi:');
    console.log(`   ${applicationId}\n`);

    return {
      entrepreneurId,
      productId,
      applicationId,
    };
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestData();
