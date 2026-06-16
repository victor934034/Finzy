# ── Etapa 1: build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

# Vars de build (Vite bake-in) — usadas apenas em dev local
# Em produção (Docker/EasePanel) window.__ENV__ é injetado em runtime
ARG VITE_SUPABASE_URL=""
ARG VITE_SUPABASE_ANON_KEY=""
ARG VITE_API_URL=""

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Etapa 2: servir com nginx ────────────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist          /usr/share/nginx/html
COPY nginx.conf                        /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh             /docker-entrypoint.sh
RUN  chmod +x /docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
