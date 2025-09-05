# ---------- Base Image ----------
FROM node:20-alpine AS base

# System dependencies for native modules
RUN apk add --no-cache libc6-compat

WORKDIR /app

# ---------- Dependencies Layer ----------
FROM base AS deps

WORKDIR /app
COPY package*.json ./

# Install production dependencies (including PM2 if in package.json)
RUN npm ci --only=production && npm cache clean --force

# ---------- Build Layer ----------
FROM base AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci  # Install devDependencies too

COPY . .
RUN npm install -g esbuild
ENV NODE_ENV=production
RUN npm run build:server --ignore-scripts=false

# ---------- Runner Layer ----------
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=5000
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 cakesbuy

# Copy built app and dependencies
COPY --from=builder --chown=cakesbuy:nodejs /app/dist ./dist
COPY --from=builder --chown=cakesbuy:nodejs /app/server ./server
COPY --from=builder --chown=cakesbuy:nodejs /app/shared ./shared
# Copy *all* node_modules (not just production) to ensure devDependencies like vite are present
COPY --from=builder --chown=cakesbuy:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=cakesbuy:nodejs /app/package*.json ./
COPY --from=builder --chown=cakesbuy:nodejs /app/ecosystem.config.mjs ./
# Copy .env file if present
COPY --from=builder --chown=cakesbuy:nodejs /app/.env ./
RUN sed -i 's/\r$//' ecosystem.config.mjs && chmod 644 ecosystem.config.mjs

RUN node --version && npm --version
# Set timezone
ENV TZ=Asia/Kolkata

RUN mkdir -p ./logs && chown -R cakesbuy:nodejs ./logs

USER cakesbuy

EXPOSE 5000

CMD ["sh", "-c", "npx pm2-runtime dist/index.js || node dist/index.js"]