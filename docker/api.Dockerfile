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
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @iiiiibox/database exec prisma generate
RUN pnpm turbo build --filter=@iiiiibox/api

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app .
EXPOSE 4000
CMD ["sh", "-c", "pnpm --filter @iiiiibox/database exec prisma migrate deploy && node apps/api/dist/main.js"]
