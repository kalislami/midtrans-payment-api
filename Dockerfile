# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build
RUN npm prune --omit=dev

# Stage 2: Production runtime
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY config ./config
COPY migrations ./migrations
COPY .sequelizerc ./

EXPOSE 3000

CMD ["sh", "-c", "npm run migrate && npm run start"]
