# ============================================================
# FinanceIA — Imagem única (frontend buildado + API Express)
# Frontend e backend rodam na mesma porta (3001)
# ============================================================

# ── Stage 1: build do frontend ───────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
# Sem VITE_API_URL pois a API está na mesma origem
RUN npm run build

# ── Stage 2: backend + frontend estático ─────────────────
FROM node:20-alpine
WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/ .

# Copia o build do frontend para /app/public
COPY --from=frontend-builder /build/dist ./public

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -q --spider http://localhost:3001/health || exit 1

CMD ["node", "index.js"]
