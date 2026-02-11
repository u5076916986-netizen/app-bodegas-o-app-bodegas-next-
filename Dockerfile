# syntax=docker/dockerfile:1

### Build stage
FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

### Runtime stage
FROM node:20-bookworm-slim AS runner
WORKDIR /app

# Instalar curl para healthchecks opcionales
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copiamos lo necesario para runtime
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/data ./data

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "run", "start"]
