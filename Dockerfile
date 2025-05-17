# Base image
FROM node:20-slim AS base
WORKDIR /app
RUN npm install -g pnpm
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Build stage
FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install
COPY . .
RUN npx prisma generate
RUN pnpm build

# Production stage
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends \
    tini \
    openssl \
    && rm -rf /var/lib/apt/lists/* \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nestjs
RUN chown nestjs:nodejs /app
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
# Copy Prisma generated files (using the correct path found in the build logs)
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.pnpm/@prisma+client@6.5.0_prisma@6.5.0_typescript@5.7.3__typescript@5.7.3/node_modules/.prisma ./node_modules/.prisma
# Copy Firebase configuration
COPY --chown=nestjs:nodejs firebase.json ./
COPY --chown=nestjs:nodejs vision.json ./
USER nestjs
EXPOSE 80
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/src/main.js", "--experimental-specifier-resolution=node"]