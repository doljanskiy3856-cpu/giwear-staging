FROM oven/bun:1.3.5

WORKDIR /app

# Copy package files for install
COPY package.json bun.lock ./
COPY packages/web/package.json ./packages/web/
COPY packages/web/src ./packages/web/src
COPY packages/web/vite ./packages/web/vite
COPY packages/web/vite.config.ts ./packages/web/
COPY packages/web/tsconfig.json ./packages/web/
COPY packages/web/tsconfig.app.json ./packages/web/
COPY packages/web/tsconfig.node.json ./packages/web/
COPY packages/web/index.html ./packages/web/
COPY packages/web/public ./packages/web/public
COPY packages/web/components.json ./packages/web/
COPY tsconfig.json ./
COPY turbo.json ./

# Install deps
RUN bun install

# Build — must run from packages/web dir where index.html lives
WORKDIR /app/packages/web
RUN bunx vite build

WORKDIR /app

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

CMD ["bun", "packages/web/src/server.ts"]
