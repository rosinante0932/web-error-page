# -------------------------
# 1) build stage
# -------------------------
FROM node:22.15.0-alpine AS builder

WORKDIR /app

# pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 仅复制依赖文件（利用缓存）
COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

# 复制源码
COPY . .

# 构建（生产环境）
ENV APP_ENV=prod
RUN pnpm run build:prod


# -------------------------
# 2) runtime stage
# -------------------------
FROM node:22.15.0-alpine

WORKDIR /app

# 只保留运行需要的文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

ENV HOST=0.0.0.0
ENV PORT=4321
ENV NODE_ENV=production
ENV APP_ENV=prod

EXPOSE 4321

CMD ["node", "--max-old-space-size=2048", "--abort-on-uncaught-exception", "--trace-warnings", "./dist/server/entry.mjs"]
