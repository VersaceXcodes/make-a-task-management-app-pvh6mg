# Build stage for frontend
FROM node:20-slim AS frontend-builder

# Set working directory for frontend
WORKDIR /app/vitereact

# Copy frontend package files and install dependencies
COPY vitereact/package*.json ./
RUN npm install --quiet

# Copy frontend source
COPY vitereact/ ./

# Build frontend
RUN npm run build

# Build stage for backend
FROM node:20-slim AS backend-builder

# Set working directory for backend
WORKDIR /app/backend

# Copy backend package files and install dependencies
COPY backend/package*.json ./
RUN npm install --quiet --production

# Copy backend source
COPY backend/ ./

# Production stage
FROM node:20-slim

WORKDIR /app/backend

# Copy built frontend from frontend-builder
COPY --from=frontend-builder /app/vitereact/dist /app/backend/public
# Copy backend from backend-builder
COPY --from=backend-builder /app/backend ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start the application
CMD ["node", "server.js"]