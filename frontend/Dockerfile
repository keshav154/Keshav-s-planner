FROM node:18-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
# allow customization of build output directory (default: dist)
ARG BUILD_DIR=dist
RUN npm run build

FROM nginx:stable-alpine
# Remove default config and add SPA-friendly config
RUN rm /etc/nginx/conf.d/default.conf || true
COPY nginx.conf /etc/nginx/conf.d/planner.conf
COPY --from=builder /usr/src/app/${BUILD_DIR} /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]