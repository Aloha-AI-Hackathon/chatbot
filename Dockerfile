# Multi-stage build for KiloKōkua project
# This Dockerfile combines both frontend and backend builds

#######################
# Frontend Build Stage
#######################
FROM node:18 as frontend-build

# Set working directory
WORKDIR /app/frontend

# Copy package.json and package-lock.json
COPY chatbot/package*.json ./

# Install dependencies
RUN npm install

# Copy frontend files
COPY chatbot/ ./

# Build the frontend
RUN npm run build

#######################
# Backend Build Stage
#######################
FROM python:3.9-slim as backend-build

WORKDIR /app/backend

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY backend/ .

# Make migration script executable
RUN chmod +x scripts/migrate.py

#######################
# Final Stage - Nginx
#######################
FROM nginx:alpine

# Copy frontend build files
COPY --from=frontend-build /app/frontend/build /usr/share/nginx/html

# Copy nginx configuration
COPY chatbot/nginx.conf /etc/nginx/conf.d/default.conf

# Create directory for backend
RUN mkdir -p /app/backend

# Copy backend files from backend build
COPY --from=backend-build /app/backend /app/backend
COPY --from=backend-build /usr/local/lib/python3.9 /usr/local/lib/python3.9
COPY --from=backend-build /usr/local/bin /usr/local/bin

# Create startup script
RUN echo '#!/bin/sh\n\
# Start backend in background\n\
cd /app/backend && python scripts/migrate.py && python run.py &\n\
\n\
# Start nginx in foreground\n\
nginx -g "daemon off;"\n\
' > /start.sh && chmod +x /start.sh

# Expose port 80
EXPOSE 80

# Command to run the application
CMD ["/start.sh"]
