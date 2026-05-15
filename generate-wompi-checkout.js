#!/usr/bin/env node

/**
 * Script para generar la URL de checkout de Wompi
 */

const APP_ID = 'bdbe9ccd-9585-4ebb-9ebb-03e8791a7c3b';
const AMOUNT_COP = 50000;

// Variables de Wompi
const PUBLIC_KEY = 'pub_prod_ECx7oR7jexTtp6tFmFMYXw8FpMVgARip';
const REDIRECT_URL = 'https://donated-natural-subwoofer.ngrok-free.dev/inscripcion/confirmacion';

// Construir la URL de checkout
const checkoutUrl = new URL('https://checkout.wompi.co/p/');
checkoutUrl.searchParams.set('public-key', PUBLIC_KEY);
checkoutUrl.searchParams.set('currency', 'COP');
checkoutUrl.searchParams.set('amount-in-cents', String(AMOUNT_COP * 100)); // Wompi usa centavos
checkoutUrl.searchParams.set('reference', APP_ID);
checkoutUrl.searchParams.set('redirect-url', REDIRECT_URL);

console.log('\n' + '='.repeat(80));
console.log('🛒 URL DE CHECKOUT WOMPI GENERADA\n');
console.log('Application ID:', APP_ID);
console.log('Monto:         COP ' + AMOUNT_COP.toLocaleString());
console.log('Referencia:    ' + APP_ID);
console.log('\n✨ URL COMPLETA:\n');
console.log(checkoutUrl.toString());
console.log('\n' + '='.repeat(80));
console.log('\n📱 Abre este enlace en tu navegador para completar el pago:\n');
console.log(checkoutUrl.toString());
console.log('\n');
