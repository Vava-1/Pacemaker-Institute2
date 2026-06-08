# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
RUN addgroup -g 1001 -S nodejs && adduser -S pacemaker -u 1001
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder --chown=pacemaker:nodejs /app/dist ./dist
COPY --from=builder --chown=pacemaker:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=pacemaker:nodejs /app/package.json ./

RUN mkdir -p /app/uploads && chown pacemaker:nodejs /app/uploads

USER pacemaker

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/live', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "dist/api/boot.js"]
