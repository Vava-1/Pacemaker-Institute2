# Stage 1: Install ALL dependencies and build
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force
COPY . .
RUN npm run build

# Stage 2: Production dependencies only
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Stage 3: Runner
FROM node:20-alpine AS runner
RUN addgroup -g 1001 -S nodejs && adduser -S pacemaker -u 1001
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder --chown=pacemaker:nodejs /app/dist ./dist
COPY --from=deps --chown=pacemaker:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=pacemaker:nodejs /app/package.json ./
COPY --from=builder --chown=pacemaker:nodejs /app/drizzle.config.ts ./
COPY --from=builder --chown=pacemaker:nodejs /app/backend/db ./backend/db

RUN mkdir -p /app/uploads && chown pacemaker:nodejs /app/uploads

USER pacemaker

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/live', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "dist/boot.js"]
