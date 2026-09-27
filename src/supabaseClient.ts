// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
	console.warn('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before deployment.');
}

export const supabase = createClient(
	supabaseUrl || 'https://placeholder.supabase.co',
	supabaseAnonKey || 'missing-supabase-anon-key',
);

