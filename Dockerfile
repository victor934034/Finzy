# ── Stage 1: build do frontend ───────────────────────────
FROM node:22-alpine AS frontend-builder
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# ── Stage 2: backend + frontend estático ─────────────────
FROM node:22-alpine
WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/ .
COPY --from=frontend-builder /build/dist ./public

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -q --spider http://localhost:${PORT:-3001}/health || exit 1

CMD ["node", "index.js"]
