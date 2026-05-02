# ─── Frontend Dockerfile ──────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Build-time env var for the API URL (injected via docker-compose)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Serve with nginx ──────────────────────────────────────────────────────────
FROM nginx:1.25-alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html

# SPA fallback – all routes → index.html
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf

EXPOSE 6442
CMD ["nginx", "-g", "daemon off;"]
