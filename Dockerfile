# Builder
FROM node:24 AS builder
WORKDIR /app

COPY package*.json ./

COPY lab03/tsconfig.json ./

RUN npm install

COPY lab03/src/ ./src/

RUN npm run build

# Production
FROM node:24
WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist

USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]