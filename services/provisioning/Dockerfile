FROM node:20-slim AS base

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install --production=false

# Copy source
COPY . .

# Build
RUN npx tsc

# Production
FROM node:20-slim
WORKDIR /app
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY package.json ./

EXPOSE 3100

CMD ["node", "dist/index.js"]
