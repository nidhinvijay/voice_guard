🎙️ VoiceGuard: Real-Time Speech Analysis & Moderation
VoiceGuard is a web application built with Django and Google Cloud that provides real-time transcription and moderation of speech to foster respectful communication.

📖 About The Project
VoiceGuard is designed to create a safer digital environment by analyzing spoken words in near real-time. It accepts audio input, transcribes it using Google Cloud's high-performance streaming API, and then uses a hybrid AI approach to moderate the content. Disrespectful or toxic language is flagged, and a polite alternative is suggested by a generative AI.

The project features two modes: a single-file upload for analyzing pre-recorded audio and a high-performance real-time mode for live conversations.

Key Features
High-Performance Real-Time Transcription using Google Cloud Speech-to-Text.

Intelligent Content Moderation with a hybrid approach:

Fast, initial screening using Google's Perspective API.

Creative, rephrased suggestions for flagged content using Google's Gemini API.

Single-File Analysis for uploaded or browser-recorded audio.

Asynchronous Backend built with Django Channels and Daphne for handling concurrent WebSocket connections.

Clean, Interactive UI for displaying live results and moderation alerts.

🛠️ Tech Stack & Architecture
This project uses a modern, production-grade architecture that separates transcription from moderation for maximum performance.

Backend: Django, Django Channels, Daphne

Frontend: HTML, CSS, JavaScript, Bootstrap

Speech-to-Text: Google Cloud Speech-to-Text (Streaming API)

Moderation: Google Perspective API, Google Gemini API

Database: SQLite (for development)

Architecture Diagram
              +----------------------------+
              |       User's Browser       |
              +-------------^--------------+
                            |
           (Audio Stream via WebSocket)
                            |
              +-------------v--------------+
              | Google Cloud Speech-to-Text|  <-- (1. Transcription)
              +-------------^--------------+
                            |
   (Final Transcript via JavaScript)
                            |
+---------------------------v----------------------------+
|                  Your Django Application               |
| +----------------------------------------------------+ |
| | WebSocket (Channels) -> Moderation Service (Python)| |  <-- (2. Moderation)
| +----------------------^-----------------------------+ |
|                        |                               |
| (API Call to Perspective & Gemini)                     |
|                        |                               |
+------------------------|-------------------------------+
                         |
           (Final Result via WebSocket)
                         |
              +----------v---------------+
              |      User's Browser      |
              +--------------------------+
🚀 Getting Started
To get a local copy up and running, follow these simple steps.

Prerequisites
Python 3.8+

Git

Installation
Clone the repository:

Bash

git clone https://github.com/your-username/voiceguard_project.git
cd voiceguard_project
Create and activate a virtual environment:

Bash

# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
Install the required packages:

Bash

pip install -r requirements.txt
Set up your environment variables:

Create a file named .env in the project root.

Create a Google Cloud project, enable the "Cloud Speech-to-Text API" and "Perspective Comment Analyzer API", and create a Service Account with a JSON key.

Place the downloaded key file in the project root (e.g., gcloud-credentials.json).

Add your credentials to the .env file:

Code snippet

GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
PERSPECTIVE_API_KEY="YOUR_PERSPECTIVE_API_KEY_HERE"
# Use the full, absolute path to your key file
GOOGLE_APPLICATION_CREDENTIALS="C:/path/to/your/project/gcloud-credentials.json"
Run database migrations:

Bash

python manage.py migrate
Run the ASGI server:

Bash

daphne voiceguard.asgi:application
The application will be available at http://127.0.0.1:8000.

usage
Single-File Mode: Navigate to the homepage, upload an audio file or use the record button, and click "Analyze."

Real-Time Mode: Navigate to the /realtime page, click "Start Listening," and allow microphone access. The application will transcribe and moderate your speech as you talk.