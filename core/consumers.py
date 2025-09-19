# core/consumers.py

import asyncio
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from google.cloud import speech
from . import production_services # Our moderation service

class RealtimeConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        print("Real-time socket connected.")
        self.audio_queue = asyncio.Queue()
        asyncio.create_task(self.transcribe_task())

    async def disconnect(self, close_code):
        print(f"Real-time socket disconnected with code: {close_code}")
        await self.audio_queue.put(None)

    async def receive(self, bytes_data):
        await self.audio_queue.put(bytes_data)

    async def transcribe_task(self):
        """Streams audio to Google, gets transcript, then sends to moderation."""
        try:
            client = speech.SpeechAsyncClient()
            config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
                sample_rate_hertz=48000,
                language_code="en-US",
                enable_automatic_punctuation=True,
            )
            streaming_config = speech.StreamingRecognitionConfig(
                config=config,
                interim_results=True
            )

            async def audio_stream_generator():
                yield speech.StreamingRecognizeRequest(streaming_config=streaming_config)
                while True:
                    chunk = await self.audio_queue.get()
                    if chunk is None:
                        break
                    yield speech.StreamingRecognizeRequest(audio_content=chunk)

            print("Starting Google transcription stream...")
            responses = await client.streaming_recognize(requests=audio_stream_generator())

            async for response in responses:
                if not response.results:
                    continue
                result = response.results[0]
                if not result.alternatives:
                    continue
                
                transcript = result.alternatives[0].transcript

                # Send the interim (in-progress) transcript to the browser
                await self.send(text_data=json.dumps({
                    "type": "transcript",
                    "transcript": transcript,
                    "is_final": result.is_final,
                }))

                # If the transcript is final, send it for moderation
                if result.is_final and transcript:
                    print(f"Final transcript: '{transcript}'. Sending for moderation.")
                    
                    # We use sync_to_async to safely call our regular Python function
                    moderation_feedback = await sync_to_async(
                        production_services.get_moderation_feedback
                    )(transcript)
                    
                    # Send the separate moderation result back to the browser
                    await self.send(text_data=json.dumps({
                        "type": "moderation",
                        "feedback": moderation_feedback
                    }))

        except Exception as e:
            print(f"CRITICAL ERROR in transcription task: {e}")
        finally:
            print("Transcription task finished.")