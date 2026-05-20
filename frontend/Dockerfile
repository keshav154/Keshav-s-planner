FROM node:22-bullseye-slim AS builder
WORKDIR /usr/src/app

# Install minimal build tools (helps with packages that expect Python/build tools)
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 build-essential && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
# allow customization of build output directory (default: dist)
ARG BUILD_DIR=dist
# Build with PWA plugin disabled (vite-plugin-pwa has ESM/CJS issues in Docker)
# If your vite.config uses a DISABLE_PWA env var, set it here; otherwise comment/remove this line and update vite.config.ts
RUN VITE_PWA_DISABLED=true npm run build

FROM node:22-bullseye-slim
WORKDIR /usr/src/app

# Copy built dist and server.js from builder
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/server.js ./server.js
COPY --from=builder /usr/src/app/package*.json ./

# Install only production deps
RUN npm ci --only=production

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]