#!/usr/bin/env node

/**
 * Script de prueba para validar el callback de Wompi
 * Ejecutar con: node test-wompi-callback.js
 */

const https = require('https');

const TEST_CASES = [
  {
    name: 'Pago completado - Test 1',
    data: {
      applicationId: '123e4567-e89b-12d3-a456-426614174000',
      wompiReference: 'wompi-ref-12345',
      wompiStatus: 'completed',
      payment_completed_at: new Date().toISOString(),
    },
  },
  {
    name: 'Pago completado - Test 2 (Con referencia alternativa)',
    data: {
      reference: '223e4567-e89b-12d3-a456-426614174001',
      wompi_reference: 'wompi-ref-67890',
      wompi_status: 'completed',
      payment_completed_at: new Date().toISOString(),
    },
  },
  {
    name: 'Pago fallido',
    data: {
      applicationId: '323e4567-e89b-12d3-a456-426614174002',
      wompiReference: 'wompi-ref-failed-111',
      wompiStatus: 'failed',
      payment_completed_at: new Date().toISOString(),
    },
  },
];

function makeRequest(testCase) {
  return new Promise((resolve) => {
    const data = JSON.stringify(testCase.data);
    const options = {
      hostname: 'donated-natural-subwoofer.ngrok-free.dev',
      path: '/api/payments/wompi/callback',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
      rejectUnauthorized: false,
    };

    console.log(`\n📤 Enviando: ${testCase.name}`);
    console.log('Payload:', JSON.stringify(testCase.data, null, 2));

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        console.log(`\n✅ Status: ${res.statusCode}`);
        try {
          const parsed = JSON.parse(responseData);
          console.log('Respuesta:', JSON.stringify(parsed, null, 2));
        } catch {
          console.log('Respuesta:', responseData);
        }
        resolve({ status: res.statusCode, data: responseData });
      });
    });

    req.on('error', (e) => {
      console.error('❌ Error:', e.message);
      resolve({ status: 'error', data: e.message });
    });

    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Iniciando pruebas de callback Wompi...\n');
  console.log(`Target: https://donated-natural-subwoofer.ngrok-free.dev/api/payments/wompi/callback\n`);

  for (const testCase of TEST_CASES) {
    await makeRequest(testCase);
    // Esperar 1 segundo entre pruebas
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('\n\n✨ Todas las pruebas completadas');
}

runTests();
