# ---- build the client ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci
COPY client client
RUN npm run build

# ---- runtime: one service serves the API, WebSocket sync and the built client ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=5000 DATA_DIR=/data
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci --omit=dev --workspace=server --include-workspace-root=false
COPY server server
COPY --from=build /app/client/dist client/dist
VOLUME /data
EXPOSE 5000
HEALTHCHECK CMD wget -qO- http://localhost:5000/api/health || exit 1
CMD ["node", "server/src/index.js"]
