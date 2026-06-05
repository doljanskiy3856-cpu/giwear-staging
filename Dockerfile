FROM oven/bun:1.3.5

WORKDIR /app

# Copy all files
COPY . .

# Install deps
RUN bun install

# Build frontend
RUN cd packages/web && bunx vite build

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["bun", "packages/web/src/server.ts"]
