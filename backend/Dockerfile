FROM node:20-slim

# Install sqlite3 build tools
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy source
COPY src/ ./src/

# Create data directory for SQLite (mapped to a Fly volume)
RUN mkdir -p /data

EXPOSE 8080

ENV PORT=8080
ENV NODE_ENV=production
ENV DB_PATH=/data/autopulse.db

CMD ["node", "src/server.js"]
