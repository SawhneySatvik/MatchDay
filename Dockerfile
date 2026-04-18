# Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Build app
FROM node:20-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Build-time env injection
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

# 🔍 DEBUG: print value inside Docker build
RUN echo "=== DOCKER BUILD ARG ==="
RUN echo "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: $NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"
RUN echo "========================"

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Run app
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080
ENV PORT=8080

CMD ["node", "server.js"]