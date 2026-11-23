FROM node:24-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY index.html vite.config.js ./
COPY src/ ./src/
COPY shared/ ./shared/
COPY public/ ./public/
RUN npm run build && npm prune --omit=dev --no-audit --no-fund

FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4173 \
    PH_AUTH_MODE=clerk PH_DB_PATH=/data/marketplace.sqlite
RUN install -d -m 0700 -o node -g node /data

COPY --from=build /app/node_modules/ ./node_modules/
COPY --from=build /app/dist/ ./dist/
COPY package.json ./
COPY server/ ./server/
COPY shared/ ./shared/
COPY public/maps/places.json ./public/maps/places.json
COPY scripts/backup-database.mjs ./scripts/backup-database.mjs

USER node
EXPOSE 4173
CMD ["node", "server/index.js", "--production"]
