const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mytfhahvpysnszzxzjdd.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkApplication() {
  const appId = 'bdbe9ccd-9585-4ebb-9ebb-03e8791a7c3b';
  
  const { data: app, error } = await supabase
    .from('applications')
    .select('id, status, wompi_reference, wompi_status, payment_completed_at')
    .eq('id', appId)
    .single();
  
  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('\n📋 Application Status:');
    console.log('ID:', app.id);
    console.log('Status:', app.status);
    console.log('Wompi Reference:', app.wompi_reference);
    console.log('Wompi Status:', app.wompi_status);
    console.log('Payment Completed At:', app.payment_completed_at);
    
    // Also check memberships
    const { data: memberships, error: mError } = await supabase
      .from('memberships')
      .select('*')
      .eq('application_id', appId);
    
    if (!mError && memberships.length > 0) {
      console.log('\n💳 Memberships:');
      memberships.forEach((m, i) => {
        console.log(`  [${i+1}] ID: ${m.id}, Status: ${m.status}`);
      });
    }
  }
}

checkApplication().catch(console.error);
