import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Supabase Configuration Check:');
console.log('URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('URL Value:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? 
  (supabaseAnonKey.length > 100 ? '✅ Valid length' : '❌ Too short') : 
  '❌ Missing'
);
console.log('Anon Key Length:', supabaseAnonKey?.length);

let supabase: any;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Using demo mode.');
  // Create a mock client for demo purposes
  const mockClient = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: () => Promise.resolve({ data: null, error: { message: 'Demo mode - Supabase not configured' } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Demo mode - Supabase not configured' } }),
      signOut: () => Promise.resolve({ error: null })
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Demo mode' } }) }) }),
      insert: () => Promise.resolve({ error: { message: 'Demo mode' } }),
      update: () => ({ eq: () => Promise.resolve({ error: { message: 'Demo mode' } }) }),
      upsert: () => Promise.resolve({ error: { message: 'Demo mode' } })
    })
  };
  
  supabase = mockClient;
} else {
  try {
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    });
    console.log('✅ Supabase client created successfully');
  } catch (error) {
    console.error('❌ Error creating Supabase client:', error);
    // Fallback to mock client
    const mockClient = {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signUp: () => Promise.resolve({ data: null, error: { message: 'Demo mode - Supabase client error' } }),
        signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Demo mode - Supabase client error' } }),
        signOut: () => Promise.resolve({ error: null })
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Demo mode' } }) }) }),
        insert: () => Promise.resolve({ error: { message: 'Demo mode' } }),
        update: () => ({ eq: () => Promise.resolve({ error: { message: 'Demo mode' } }) }),
        upsert: () => Promise.resolve({ error: { message: 'Demo mode' } })
      })
    };
    supabase = mockClient;
  }
}

export { supabase };