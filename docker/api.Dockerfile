# syntax=docker/dockerfile:1
FROM node:20-alpine AS pruner
RUN corepack enable
WORKDIR /app
COPY . .
RUN npx turbo prune @iiiiibox/api --docker

FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
RUN corepack enable
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN --mount=type=cache,id=pnpm-api,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
COPY docker/libquery_engine.so.node /tmp/libquery_engine.so.node
ENV PRISMA_QUERY_ENGINE_LIBRARY=/tmp/libquery_engine.so.node
RUN PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 pnpm --filter @iiiiibox/database exec prisma generate
RUN pnpm turbo build --filter=@iiiiibox/api

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production
ENV PRISMA_QUERY_ENGINE_LIBRARY=/app/libquery_engine.so.node
COPY docker/libquery_engine.so.node /app/libquery_engine.so.node
COPY --from=builder /app .
EXPOSE 4000
CMD ["sh", "-c", "pnpm --filter @iiiiibox/database exec prisma migrate deploy && node apps/api/dist/main.js"]
