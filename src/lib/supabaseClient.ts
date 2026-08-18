import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_SUPABASE_URL = '24LIBRARY_SUPABASE_URL';
const STORAGE_KEY_SUPABASE_KEY = '24LIBRARY_SUPABASE_KEY';

// Get active configuration from environment or localStorage
export function getSupabaseConfig(): { url: string; anonKey: string } {
  const url = localStorage.getItem(STORAGE_KEY_SUPABASE_URL) || (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SUPABASE_URL || '';
  const anonKey = localStorage.getItem(STORAGE_KEY_SUPABASE_KEY) || (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY || '';
  return { url, anonKey };
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  localStorage.setItem(STORAGE_KEY_SUPABASE_URL, url.trim());
  localStorage.setItem(STORAGE_KEY_SUPABASE_KEY, anonKey.trim());
  _client = null; // Invalidate current client to re-instantiate
}

export function clearSupabaseConfig() {
  localStorage.removeItem(STORAGE_KEY_SUPABASE_URL);
  localStorage.removeItem(STORAGE_KEY_SUPABASE_KEY);
  _client = null;
}

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (_client) return _client;

  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;

  try {
    _client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    return _client;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const testClient = createClient(url, anonKey);
    // Simple ping query against organizations or branches
    const { data, error } = await testClient.from('branches').select('count', { count: 'exact', head: true });
    
    if (error) {
      // If table doesn't exist yet, it's still reachable
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Connected to Supabase! (Database tables need migration: run schema.sql in Supabase SQL editor)',
        };
      }
      return { success: false, message: `Connection error: ${error.message}` };
    }

    return { success: true, message: 'Successfully connected to Supabase PostgreSQL Database!' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Network/CORS error: ${msg}` };
  }
}
