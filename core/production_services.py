# core/production_services.py
import os
import google.generativeai as genai
from googleapiclient import discovery
from dotenv import load_dotenv
from google.cloud import speech 
from pydub import AudioSegment
import io

load_dotenv()

PERSPECTIVE_API_KEY = os.getenv("PERSPECTIVE_API_KEY")
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def get_rephrased_suggestion_from_gemini(text):
    """
    Calls Gemini to rephrase an offensive sentence into a polite one.
    """
    try:
        # BREADCRUMB 3: We are about to call Gemini.
        print("       L-- 🧠 Calling Gemini API for a suggestion...")
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f'The following sentence was flagged as disrespectful: "{text}". Rewrite it into a polite and respectful alternative. Provide only the rewritten phrase.'
        response = model.generate_content(prompt)
        
        # BREADCRUMB 4: Gemini has responded.
        print("      L-- ✅ Gemini API responded successfully.")
        
        return response.text.strip()
    except Exception as e:
        print(f"      L-- ❌ ERROR calling Gemini for rephrasing: {e}")
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

        if toxicity_score > 0.7:
            status = 'offensive'
            suggestion = get_rephrased_suggestion_from_gemini(text)
        else:
            status = 'clean'
            suggestion = ""

        return {
            "status": status,
            "suggestion": suggestion,
            "score": f"{toxicity_score:.2f}",
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