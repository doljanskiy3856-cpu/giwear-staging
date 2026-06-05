FROM oven/bun:1.3.5

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
COPY packages/web/package.json ./packages/web/
COPY packages/web/src ./packages/web/src
COPY packages/web/vite ./packages/web/vite
COPY packages/web/vite.config.ts ./packages/web/
COPY packages/web/tsconfig.json ./packages/web/
COPY tsconfig.json ./
COPY turbo.json ./

# Install deps
RUN bun install

# Build
RUN cd packages/web && bunx vite build

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["bun", "packages/web/src/server.ts"]
