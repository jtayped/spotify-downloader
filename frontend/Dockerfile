# frontend/Dockerfile

# --- Stage 1: Tygo Generation ---
FROM golang:1.25-alpine AS tygo-gen

WORKDIR /workspace

# 1. Install Tygo
RUN go install github.com/gzuidhof/tygo@latest

# 2. Copy config and backend source
COPY tygo.yaml .
COPY backend/ ./backend/

# 3. [CRITICAL FIX] Initialize a Go Workspace
# This tells Go: "The code in ./backend is a local module, please use it."
RUN go work init ./backend

# 4. Create output directory and Generate
RUN mkdir -p frontend/src/types
RUN tygo generate

# --- Stage 2: Node Base ---
FROM node:18-alpine AS base

# --- Stage 3: Install Dependencies ---
FROM base AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

# --- Stage 4: Build Next.js ---
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY frontend/ .

# 5. Copy the generated types from Stage 1
COPY --from=tygo-gen /workspace/frontend/src/types/api.ts ./src/types/api.ts

# 6. Build Next.js
ENV SKIP_ENV_VALIDATION=1
RUN npx next build

# --- Stage 5: Production Runner ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]