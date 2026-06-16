#!/bin/sh
set -e

# Injeta variáveis de ambiente em runtime (necessário para EasePanel/Docker)
# Assim o mesmo build funciona em qualquer ambiente sem rebuild
cat > /usr/share/nginx/html/env-config.js << ENVEOF
window.__ENV__ = {
  SUPABASE_URL: "${SUPABASE_URL}",
  SUPABASE_ANON_KEY: "${SUPABASE_ANON_KEY}",
  API_URL: "${API_URL}",
};
ENVEOF

exec nginx -g 'daemon off;'
