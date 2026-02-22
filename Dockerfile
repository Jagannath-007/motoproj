FROM node:22-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package.json backend/package-lock.json ./backend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm install --omit=dev

# Copy backend source
COPY backend/src ./src

# Copy frontend
WORKDIR /app
COPY frontend ./frontend

# Build frontend
WORKDIR /app/frontend
RUN npm install && npm run build

# Back to backend
WORKDIR /app/backend

# Expose port
EXPOSE 10000

# Start server
CMD ["node", "src/server.js"]
