# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig.json ./

# Install all dependencies (including devDependencies) to build
RUN pnpm install --frozen-lockfile

COPY src ./src

# Build the application
RUN pnpm run build

# Production stage
FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app

RUN npm install -g pnpm

COPY package.json ./
COPY pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 5001

CMD ["pnpm", "start"]
