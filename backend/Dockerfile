# Use Node
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy backend package files
COPY package.json package-lock.json ./

# Install backend dependencies
RUN npm ci --omit=dev

# Copy backend source
COPY src/ ./src/

# Copy frontend
COPY ../frontend ./frontend

# Install frontend dependencies and build
WORKDIR /app/frontend
RUN npm install && npm run build

# Go back to backend folder
WORKDIR /app

# Create data folder
RUN mkdir -p /data

# Expose port
EXPOSE 10000

# Start backend
CMD ["node", "src/server.js"]
