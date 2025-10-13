# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install Python3 and pip for ML dependencies (if needed)
RUN apk add --no-cache python3 py3-pip

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/database/schema.sql ./dist/database/ 2>/dev/null || true

# Copy and install Python dependencies (optional, for ML training)
COPY requirements.txt /tmp/requirements.txt 2>/dev/null || echo "scikit-learn>=1.0.0\ntensorflow>=2.13.0\nnumpy>=1.24.0\npandas>=2.0.0" > /tmp/requirements.txt
RUN pip3 install --no-cache-dir --break-system-packages -r /tmp/requirements.txt || \
    echo "Warning: Some Python packages failed to install. Training may use simulation mode."

# Create models directory
RUN mkdir -p /app/models /app/logs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "dist/src/server.js"]
