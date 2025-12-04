# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy Prisma schema (needed for postinstall hook)
COPY prisma ./prisma

# Install dependencies (postinstall will run prisma generate)
RUN pnpm install --frozen-lockfile

# Copy source code (explicit)
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY hooks ./hooks
COPY types ./types
COPY middleware.ts ./
COPY auth.ts ./

# Copy build config files
COPY next.config.ts ./
COPY tsconfig.json ./
COPY tailwind.config.ts ./
COPY postcss.config.mjs ./

# Build the application
RUN pnpm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application from builder (standalone includes package.json + prod node_modules)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy prisma schema for migrations
COPY --from=builder /app/prisma ./prisma

# Copy package files
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Give nextjs user ownership of entire /app directory
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Install ONLY prisma CLI from lockfile as nextjs user
# Uses --dev flag to install only devDependencies (includes prisma)
# --ignore-scripts skips postinstall hooks (we don't need prisma generate, only CLI)
RUN pnpm install --frozen-lockfile --dev --ignore-scripts

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start script that runs migrations then starts the app
CMD ["sh", "-c", "pnpm prisma:deploy && node server.js"]
