# ══════════════════════════════════════════════════════════
# Dockerfile multi-stage para PinataPoster (Next.js 15)
# Producción: Contabo VPS + Cloudflare Tunnel
# ══════════════════════════════════════════════════════════

# ── Stage 1: Dependencias ────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ── Stage 2: Build ───────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Next.js necesita las variables de entorno en build time
# para las que se incrustan en el cliente (NEXT_PUBLIC_*)
# Las server-only se leen en runtime via .env o env vars
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Stage 3: Runner (producción) ─────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Crear directorio de datos con permisos (legacy, puede eliminarse)
# RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

# Copiar solo lo necesario del build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
