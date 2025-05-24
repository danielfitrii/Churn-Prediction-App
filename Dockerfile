FROM python:3.9-slim

WORKDIR /app

# Copy requirements.txt from the backend directory and install dependencies
COPY backend/requirements.txt backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy the rest of the backend application code
COPY backend/. backend/

EXPOSE 8080

# Command to run the application using Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "backend.app:app"] 