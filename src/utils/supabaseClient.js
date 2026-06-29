import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env variables are missing! Database writes will fall back safely.');
}

// Fallback safely to prevent app crashes during local development without env files
export const supabase = createClient(
  supabaseUrl || 'https://ttgqzxwejeuuuwirtlqv.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0Z3F6eHdlamV1dXV3aXJ0bHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MTg5NTEsImV4cCI6MjA5ODI5NDk1MX0.N8uqTmtIUCbtyABJE1dS75fiHyV44_lvq1hDPqg5aS0'
);
