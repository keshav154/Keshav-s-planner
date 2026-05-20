# Builder: install build deps and compile native modules
FROM node:22-bullseye-slim AS builder
WORKDIR /usr/src/app

# Install python and build tools required by node-gyp and native modules (sqlite3)
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 build-essential g++ make pkg-config libsqlite3-dev && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
# Install all deps (including dev) in builder so native modules are compiled for the target arch
RUN npm ci

# copy source and build if applicable
COPY . .
RUN npm run build || true

# Final: smaller runtime image without build tooling
FROM node:22-bullseye-slim AS runner
WORKDIR /usr/src/app

# runtime deps (sqlite runtime library)
RUN apt-get update && \
    apt-get install -y --no-install-recommends libsqlite3-0 && \
    rm -rf /var/lib/apt/lists/*

# Copy compiled node_modules and app from builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app ./

ENV NODE_ENV=production
EXPOSE 3000

# Use package.json start script
CMD ["npm", "start"]