# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory in the container
WORKDIR /app

# Install system dependencies, including FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the project code into the container
COPY . /app/

# Run collectstatic (this is part of the build, so it stays here)
RUN python manage.py collectstatic --noinput

# Expose the port the app runs on
EXPOSE 8000

# THE FIX: Chain the migrate and daphne commands together.
# This will run every time your server starts.
CMD python manage.py migrate && daphne -b 0.0.0.0 -p 8000 voiceguard.asgi:application