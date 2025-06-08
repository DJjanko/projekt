# Use python base image
FROM python:3.10

# Install system dependencies for OpenCV
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0

# Working directory
WORKDIR /app

# Copy and install requirements
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy your code
COPY . .

# Expose Flask port
EXPOSE 5000

# Run Flask app
CMD ["python3", "API.py"]

