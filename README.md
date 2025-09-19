# 🎙️ VoiceGuard: Real-Time Speech Analysis & Moderation

[![Python](https://img.shields.io/badge/Python-3.8+-blue)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-4.2-green)](https://www.djangoproject.com/)

VoiceGuard is a **web application** built with Django and Google Cloud that provides **real-time transcription and moderation** of speech to foster respectful and safe communication.

---

## 📖 Table of Contents

- [About The Project](#about-the-project)  
- [Key Features](#key-features)  
- [Tech Stack & Architecture](#tech-stack--architecture)  
- [Architecture Diagram](#architecture-diagram)  
- [Getting Started](#getting-started)  
  - [Prerequisites](#prerequisites)  
  - [Installation](#installation)  
- [Usage](#usage)  

---

## 📖 About The Project

VoiceGuard analyzes spoken words in **near real-time**, transcribes them using **Google Cloud Speech-to-Text**, and applies a **hybrid AI moderation** approach:

- Flag disrespectful or toxic language.
- Suggest polite alternatives using generative AI.

It supports **two modes**:

1. **Single-File Upload:** For pre-recorded audio.  
2. **Real-Time Mode:** For live conversations via microphone.

---

## Key Features

- **High-Performance Real-Time Transcription** via Google Cloud Speech-to-Text.  
- **Intelligent Content Moderation**:
  - Fast initial screening with Google Perspective API.  
  - Creative rephrased suggestions via Google Gemini API.  
- **Single-File Analysis** for uploaded or recorded audio.  
- **Asynchronous Backend** with Django Channels & Daphne for WebSocket concurrency.  
- **Interactive UI** for live transcription and moderation alerts.  

---

## Tech Stack & Architecture

- **Backend:** Django, Django Channels, Daphne  
- **Frontend:** HTML, CSS, JavaScript, Bootstrap  
- **Speech-to-Text:** Google Cloud Speech-to-Text (Streaming API)  
- **Moderation:** Google Perspective API, Google Gemini API  
- **Database:** SQLite (development)  

---

## Architecture Diagram

vbnet
Copy code
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
| Django Application |
| +----------------------------------------------------+ |
| | WebSocket (Channels) -> Moderation Service (Python)| | <-- (2. Moderation)
| +----------------------^-----------------------------+ |
| | |
| (API Call to Perspective & Gemini) |
| | |
+------------------------|-------------------------------+
|
(Final Result via WebSocket)
|
+----------v---------------+
| User's Browser |
+--------------------------+

yaml
Copy code

---

## 🚀 Getting Started

### Prerequisites

- Python 3.8+  
- Git  

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/your-username/voiceguard_project.git
cd voiceguard_project
Create and activate a virtual environment:

bash
Copy code
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
Install dependencies:

bash
Copy code
pip install -r requirements.txt
Configure environment variables:

Create a .env file in the project root.

Enable Cloud Speech-to-Text API and Perspective Comment Analyzer API in Google Cloud.

Create a Service Account and download the JSON key (gcloud-credentials.json).

Add credentials to .env:

env
Copy code
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
PERSPECTIVE_API_KEY="YOUR_PERSPECTIVE_API_KEY_HERE"
GOOGLE_APPLICATION_CREDENTIALS="C:/path/to/your/project/gcloud-credentials.json"
Run migrations:

bash
Copy code
python manage.py migrate
Start the ASGI server:

bash
Copy code
daphne voiceguard.asgi:application
Access the app at http://127.0.0.1:8000.

Usage
Single-File Mode: Upload or record audio on the homepage and click "Analyze".

Real-Time Mode: Go to /realtime, click "Start Listening", and allow microphone access for live transcription and moderation.

