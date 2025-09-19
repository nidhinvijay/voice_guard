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

# Run collectstatic and migrations
RUN python manage.py collectstatic --noinput
RUN python manage.py migrate

# Expose the port the app runs on
EXPOSE 8000

# Run the application
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "voiceguard.asgi:application"]