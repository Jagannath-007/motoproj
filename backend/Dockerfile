FROM node:20-slim

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src/ ./src/

RUN mkdir -p /data

EXPOSE 8080

ENV PORT=8080
ENV NODE_ENV=production
ENV DB_PATH=/data/autopulse.db

CMD ["node", "src/server.js"]
