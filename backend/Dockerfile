FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Make migration script executable
RUN chmod +x scripts/migrate.py

# Expose the port the app runs on
EXPOSE 8000

# Create startup script
RUN echo '#!/bin/bash\n\
echo "Running database migrations..."\n\
python scripts/migrate.py\n\
echo "Starting application..."\n\
exec python run.py\n\
' > /app/start.sh && chmod +x /app/start.sh

# Command to run the application
CMD ["/app/start.sh"]
