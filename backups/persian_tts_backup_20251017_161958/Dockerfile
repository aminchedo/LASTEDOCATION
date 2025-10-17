# Multi-stage Dockerfile for Model Training Project
# Stage 1: Backend Builder
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# Install Python for ML training
RUN apk add --no-cache python3 py3-pip python3-dev build-base

# Copy backend package files
COPY BACKEND/package*.json ./
RUN npm ci --only=production

# Copy backend source
COPY BACKEND/ ./

# Build TypeScript
RUN npm run build

# Stage 2: Frontend Builder
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY client/package*.json ./
RUN npm ci

# Copy frontend source
COPY client/ ./

# Build frontend
RUN npm run build

# Stage 3: Production Image
FROM node:20-alpine

WORKDIR /app

# Install Python and system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    python3-dev \
    build-base \
    ca-certificates \
    && python3 -m ensurepip \
    && pip3 install --no-cache --upgrade pip setuptools

# Copy backend build
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package.json ./backend/

# Copy Python scripts
COPY scripts/*.py ./scripts/
COPY requirements.txt ./

# Install Python ML dependencies
RUN pip3 install --no-cache-dir -r requirements.txt || \
    echo "Warning: Some Python packages failed to install. Training may use simulation mode."

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create necessary directories
RUN mkdir -p logs models data/datasets uploads

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose ports
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Start backend server
CMD ["node", "backend/dist/src/server.js"]
