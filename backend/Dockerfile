# Builder stage: install dev deps and build (build script optional)
FROM node:18-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
# run build if present; do not fail if no build script
RUN npm run build || true

# Final image: install production deps and copy built output or source
FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
# copy everything from builder (built assets or source)
COPY --from=builder /usr/src/app ./
ENV NODE_ENV=production
EXPOSE 3000
# Use npm start so package.json dictates how the app is run.
CMD ["npm","start"]