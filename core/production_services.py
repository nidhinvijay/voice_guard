# core/production_services.py
import os
# import google.generativeai as genai
from googleapiclient import discovery
from dotenv import load_dotenv
from google.cloud import speech 
import base64
from pydub import AudioSegment
from google.cloud import texttospeech
from groq import Groq
import io

load_dotenv()

PERSPECTIVE_API_KEY = os.getenv("PERSPECTIVE_API_KEY")
# genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def get_rephrased_suggestion_from_groq(text):
    try:
        print("       L-- ⚡️ Calling Groq API for a suggestion...")
        
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant. Your task is to rewrite a disrespectful sentence into a polite and respectful alternative. Provide only the rewritten phrase itself, without any extra explanation or introductory text."
                },
                {
                    "role": "user",
                    "content": text,
                }
            ],
            model="gemma2-9b-it", # A fast and capable model on Groq
        )
        
        suggestion = chat_completion.choices[0].message.content
        print("      L-- ✅ Groq API responded successfully.")
        return suggestion.strip().replace('"', '')

    except Exception as e:
        print(f"      L-- ❌ ERROR calling Groq for rephrasing: {e}")
        return "Could not generate a suggestion."

def get_moderation_feedback(text):
    """
    Main moderation function with detailed logging.
    """
    try:
        # BREADCRUMB 1: We are about to call the Perspective API.
        print("  --> 🔍 Calling Perspective API...")
        
        client = discovery.build(
            "commentanalyzer", "v1alpha1",
            developerKey=PERSPECTIVE_API_KEY,
            static_discovery=False,
            cache_discovery=False
        )
        analyze_request = {'comment': {'text': text}, 'requestedAttributes': {'TOXICITY': {}}}
        response = client.comments().analyze(body=analyze_request).execute()
        toxicity_score = response['attributeScores']['TOXICITY']['summaryScore']['value']

        # BREADCRUMB 2: The Perspective API has responded.
        print(f"  <-- ✅ Perspective API responded with score: {toxicity_score:.2f}")

        if toxicity_score > 0.3:
            status = 'offensive'
            suggestion = get_rephrased_suggestion_from_groq(text)
            audio_suggestion = convert_text_to_speech(suggestion)
        else:
            status = 'clean'
            suggestion, audio_suggestion = "", None

        return {
            "status": status,
            "suggestion": suggestion,
            "score": f"{toxicity_score:.2f}",
            "audio_suggestion": audio_suggestion,
            "original_text": text
        }
    except Exception as e:
        print(f"  <-- ❌ ERROR in moderation pipeline: {e}")
        return {"status": "error", "message": "Failed to analyze text."}
    

def analyze_uploaded_file(audio_file):
    """
    Analyzes a complete, uploaded audio file, ensuring it is in mono format.
    """
    try:
        client = speech.SpeechClient()

        # 1. Load the audio with pydub
        sound = AudioSegment.from_file(audio_file)
        
        # 2. THIS IS THE FIX: Convert the audio to mono (1 channel)
        sound = sound.set_channels(1)
        
        # 3. Re-export it to a clean, standard WAV format in memory
        clean_wav_io = io.BytesIO()
        sound.export(clean_wav_io, format="wav")
        clean_wav_io.seek(0)

        # 4. Read the content and get the sample rate from the clean, mono audio
        content = clean_wav_io.read()
        audio = speech.RecognitionAudio(content=content)
        sample_rate = sound.frame_rate

        # 5. Configure the request
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=sample_rate,
            language_code="en-US",
            enable_automatic_punctuation=True,
        )

        print("--> 📄 Sending clean, MONO, full file to Google Cloud STT...")
        response = client.recognize(config=config, audio=audio)
        
        if not response.results:
            return {"status": "error", "message": "Could not understand the audio. The file may be silent."}

        transcribed_text = response.results[0].alternatives[0].transcript
        print(f"<-- ✅ Google Cloud responded with full transcript.")
        
        moderation_result = get_moderation_feedback(transcribed_text)
        
        return {
            "transcribed_text": transcribed_text,
            "moderation": moderation_result
        }

    except Exception as e:
        print(f"ERROR in file analysis: {e}")
        return {"status": "error", "message": f"An unexpected error occurred: {e}"}
    


def convert_text_to_speech(text):
    try:
        client = texttospeech.TextToSpeechClient()
        synthesis_input = texttospeech.SynthesisInput(text=text)
        voice = texttospeech.VoiceSelectionParams(
            language_code="en-US", ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )
        
        print("      L-- 🗣️ Calling Google TTS API...")
        response = client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )
        print("      L-- ✅ Google TTS responded successfully.")
        
        # Return audio as a Base64 string to safely send via JSON
        return base64.b64encode(response.audio_content).decode('utf-8')
    except Exception as e:
        print(f"      L-- ❌ ERROR calling Google TTS: {e}")
        return None