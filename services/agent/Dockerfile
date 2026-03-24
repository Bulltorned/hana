FROM node:20-slim AS build

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npx tsc

FROM node:20-slim
WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package.json ./

# Skills are mounted as volume at /app/skills
VOLUME ["/app/skills"]

CMD ["node", "dist/index.js"]
