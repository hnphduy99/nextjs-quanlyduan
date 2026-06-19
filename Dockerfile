FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client for the container environment
RUN npx prisma generate

# Build Next.js
RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Clean up unused sharp binaries in standalone output to save space
RUN if [ -d .next/standalone/node_modules/@img ]; then \
      ARCH=$(uname -m) && \
      if [ "$ARCH" = "x86_64" ]; then KEEP_ARCH="x64"; \
      elif [ "$ARCH" = "aarch64" ]; then KEEP_ARCH="arm64"; \
      else KEEP_ARCH=""; fi && \
      if [ -n "$KEEP_ARCH" ]; then \
        find .next/standalone/node_modules/@img -mindepth 1 -maxdepth 1 -type d ! -name "*musl-${KEEP_ARCH}" ! -name "colour" -exec rm -rf {} +; \
      fi; \
    fi


# Production image, copy all the files and run next
FROM alpine:3.20 AS runner
WORKDIR /app

ENV NODE_ENV=production
# Disable Next.js telemetry at runtime
ENV NEXT_TELEMETRY_DISABLED=1

# Install nodejs, tzdata, and add system user in a single layer
RUN apk add --no-cache nodejs tzdata && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next && chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]