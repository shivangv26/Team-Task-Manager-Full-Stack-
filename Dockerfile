FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY backend/package*.json ./
RUN npm install --production

COPY backend/ ./

# Copy built frontend into backend/dist
COPY --from=frontend-builder /app/frontend/dist ./dist

EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080

CMD ["node", "server.js"]