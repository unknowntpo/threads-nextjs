FROM node:22.12-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package*.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm exec prisma generate

# Expose port
EXPOSE 3001

# Start the application
CMD ["pnpm", "run", "start:dev"]
