FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files from mockup directory
COPY mockup/package.json mockup/package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Copy mockup directory
COPY mockup ./mockup
# Copy spec directory for build time (if needed) and runtime
COPY spec ./spec

# Build the Next.js app
WORKDIR /app/mockup
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy spec files
COPY --from=builder /app/spec ./spec

# Copy public files
COPY --from=builder /app/mockup/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/mockup/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/mockup/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
ENV SPEC_DIR=/app/spec

CMD ["node", "server.js"]
