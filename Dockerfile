FROM oven/bun:1.3.5

WORKDIR /app

# Copy everything at once (simpler, cache busting)
COPY . .

# Install all deps
RUN bun install --frozen-lockfile

# Build from correct directory (where index.html is)
RUN cd packages/web && bunx vite build --root .

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

CMD ["bun", "packages/web/src/server.ts"]
