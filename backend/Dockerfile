FROM node:22-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package.json backend/package-lock.json ./

# Install backend dependencies
RUN npm ci --omit=dev

# Copy backend source
COPY backend/src ./src

# Copy frontend folder
COPY frontend ./frontend

# Build frontend
WORKDIR /app/frontend
RUN npm install && npm run build

# Go back to backend
WORKDIR /app

# Create data folder
RUN mkdir -p /data

# Expose Render port
EXPOSE 10000

# Start server
CMD ["node", "src/server.js"]
