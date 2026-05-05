import { createClient } from '@supabase/supabase-js';

// Read environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL') {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL environment variable. Please check your .env file.'
  );
}

if (!supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable. Please check your .env file.'
  );
}

// Log successful initialization (development only)
if (__DEV__) {
  console.log('✅ Supabase client initialized');
  console.log('📍 URL:', supabaseUrl);
  console.log('🔑 Key:', supabaseAnonKey.substring(0, 20) + '...');
}

// Create and export Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
