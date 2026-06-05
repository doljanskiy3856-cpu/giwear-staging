FROM oven/bun:1.3.5

ARG CACHEBUST=2
WORKDIR /app

COPY . .

RUN bun install --frozen-lockfile

WORKDIR /app/packages/web
RUN bunx vite build

WORKDIR /app
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

CMD ["bun", "packages/web/src/server.ts"]
