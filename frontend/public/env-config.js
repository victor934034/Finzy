// Sobrescrito em runtime pelo docker-entrypoint.sh
// Em desenvolvimento local, window.__ENV__ é ignorado e import.meta.env é usado
window.__ENV__ = {
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
  API_URL: '',
};
