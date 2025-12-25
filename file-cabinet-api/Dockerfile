FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN useradd -r -u 1001 -g root app && \
    chown -R app:root /app
USER app

# Expose port
EXPOSE 8080

# Start the application
CMD ["npm", "start"]
