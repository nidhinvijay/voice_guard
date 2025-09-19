# 🎙️ VoiceGuard: Real-Time Speech Analysis & Moderation

[![Python](https://img.shields.io/badge/Python-3.8%2B-blue)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-Latest-green)](https://www.djangoproject.com/)
[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-Speech--to--Text-orange)](https://cloud.google.com/speech-to-text)

VoiceGuard is a web application built with Django and Google Cloud that provides real-time transcription and moderation of speech to foster respectful communication.

## 📖 About The Project

VoiceGuard is designed to create a safer digital environment by analyzing spoken words in near real-time. It accepts audio input, transcribes it using Google Cloud's high-performance streaming API, and then uses a hybrid AI approach to moderate the content. Disrespectful or toxic language is flagged, and a polite alternative is suggested by a generative AI.

The project features two modes: a single-file upload for analyzing pre-recorded audio and a high-performance real-time mode for live conversations.

### ✨ Key Features

- **High-Performance Real-Time Transcription** using Google Cloud Speech-to-Text
- **Intelligent Content Moderation** with a hybrid approach:
  - Fast, initial screening using Google's Perspective API
  - Creative, rephrased suggestions for flagged content using Google's Gemini API
- **Single-File Analysis** for uploaded or browser-recorded audio
- **Asynchronous Backend** built with Django Channels and Daphne for handling concurrent WebSocket connections
- **Clean, Interactive UI** for displaying live results and moderation alerts

## 🛠️ Tech Stack & Architecture

This project uses a modern, production-grade architecture that separates transcription from moderation for maximum performance.

- **Backend:** Django, Django Channels, Daphne
- **Frontend:** HTML, CSS, JavaScript, Bootstrap
- **Speech-to-Text:** Google Cloud Speech-to-Text (Streaming API)
- **Moderation:** Google Perspective API, Google Gemini API
- **Database:** SQLite (for development)

### Architecture Diagram

```
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
```

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Python 3.8+
- Git
- Google Cloud Account with enabled APIs

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nidhinvijay/voice_guard.git
   cd voiceguard_project
   ```

2. **Create and activate a virtual environment:**
   ```bash
   # On Windows
   python -m venv venv
   venv\Scripts\activate

   # On macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install the required packages:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up your environment variables:**
   
   Create a file named `.env` in the project root:
   ```env
   GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
   PERSPECTIVE_API_KEY="YOUR_PERSPECTIVE_API_KEY_HERE"
   # Use the full, absolute path to your key file
   GOOGLE_APPLICATION_CREDENTIALS="C:/path/to/your/project/gcloud-credentials.json"
   ```

5. **Set up Google Cloud:**
   - Create a Google Cloud project
   - Enable the "Cloud Speech-to-Text API" and "Perspective Comment Analyzer API"
   - Create a Service Account with a JSON key
   - Place the downloaded key file in the project root (e.g., `gcloud-credentials.json`)

6. **Run database migrations:**
   ```bash
   python manage.py migrate
   ```

7. **Run the ASGI server:**
   ```bash
   daphne voiceguard.asgi:application
   ```

   The application will be available at `http://127.0.0.1:8000`

## 📝 Usage

### Single-File Mode
Navigate to the homepage, upload an audio file or use the record button, and click "Analyze."

### Real-Time Mode
Navigate to the `/realtime` page, click "Start Listening," and allow microphone access. The application will transcribe and moderate your speech as you talk.

## 🔧 Configuration

### Required API Keys

1. **Google Cloud Speech-to-Text**: Enable the API in your Google Cloud Console
2. **Google Perspective API**: Request access and obtain API key
3. **Google Gemini API**: Obtain from Google AI Studio

### Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Your Google Gemini API key |
| `PERSPECTIVE_API_KEY` | Your Google Perspective API key |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to your Google Cloud service account JSON |

