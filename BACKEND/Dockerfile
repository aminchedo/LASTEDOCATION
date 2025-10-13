# Backend-only Dockerfile for development
FROM node:20-alpine

WORKDIR /app

# Install Python for ML training
RUN apk add --no-cache \
    python3 \
    py3-pip \
    python3-dev \
    build-base \
    ca-certificates \
    && python3 -m ensurepip \
    && pip3 install --no-cache --upgrade pip setuptools

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Copy and install Python dependencies
COPY requirements.txt /tmp/requirements.txt
RUN pip3 install --no-cache-dir -r /tmp/requirements.txt || \
    echo "Warning: Some Python packages failed to install. Training may use simulation mode."

# Copy Python scripts (if needed)
# COPY scripts/*.py /app/scripts/

# Create necessary directories
RUN mkdir -p logs models data/datasets uploads

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Start server
CMD ["npm", "start"]
