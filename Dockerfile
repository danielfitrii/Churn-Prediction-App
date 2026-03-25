FROM python:3.9-slim

# Install system dependencies for ML libraries
RUN apt-get update && apt-get install -y \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend files directly into /app
COPY backend/ .

# Set PYTHONPATH so Python looks in the current directory for modules
ENV PYTHONPATH=/app

EXPOSE 8080

# Run gunicorn directly on app:app since we are now in the same folder
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "1", "--threads", "8", "app:app"]