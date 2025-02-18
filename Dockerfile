# Use Node.js Alpine as base image for smaller size
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p /config

# Add labels for Home Assistant
LABEL \
    io.hass.name="Solar Dashboard" \
    io.hass.description="Solar power system dashboard addon" \
    io.hass.version="1.0.0" \
    io.hass.type="addon" \
    io.hass.arch="armhf|armv7|aarch64|amd64|i386"

# Expose port
EXPOSE 8099

# Set environment variables
ENV NODE_ENV=production

# Create a non-root user for security
RUN addgroup -S app && \
    adduser -S -G app app && \
    chown -R app:app /usr/src/app

# Switch to non-root user
USER app

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8099/ || exit 1

# Start the application
CMD ["node", "index.js"]