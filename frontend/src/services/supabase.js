import { createClient } from '@supabase/supabase-js';

// Em Docker/EasePanel: window.__ENV__ injetado pelo docker-entrypoint.sh
// Em dev local:        import.meta.env carregado pelo Vite (.env)
const url = window.__ENV__?.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const key = window.__ENV__?.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Supabase não configurado. Verifique SUPABASE_URL e SUPABASE_ANON_KEY.');
}

export const supabase = createClient(url, key);
