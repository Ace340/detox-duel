// Test Supabase connection
import { supabase } from './src/services/supabase';

console.log('Testing Supabase connection...');
console.log('URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('Key exists:', !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

// Test a simple query
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username')
      .limit(1);

    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }

    console.log('✅ Supabase connection successful!');
    console.log('📊 Sample data:', data);
    return true;
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return false;
  }
}

testConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
