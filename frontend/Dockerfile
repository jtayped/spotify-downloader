# frontend/Dockerfile

# --- Stage 1: Tygo Generation ---
FROM golang:1.25-alpine AS tygo-gen

WORKDIR /workspace

# Install Tygo
RUN go install github.com/gzuidhof/tygo@latest

# Copy config and backend source
COPY tygo.yaml .
COPY backend/ ./backend/

# Initialize a Go Workspace so tygo can resolve the local module
RUN go work init ./backend

# Create output directory and generate types
RUN mkdir -p frontend/src/types
RUN tygo generate

# --- Stage 2: Node Base ---
FROM node:20-alpine AS base

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

# Copy the generated types from Stage 1
COPY --from=tygo-gen /workspace/frontend/src/types/api.ts ./src/types/api.ts

# Accept API_URL as a build argument and expose it to Next.js at build time
ARG API_URL
ENV API_URL=$API_URL

ENV SKIP_ENV_VALIDATION=1
RUN npx next build

# --- Stage 5: Production Runner ---
FROM node:20-alpine AS runner
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
