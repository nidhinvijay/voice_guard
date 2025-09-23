# core/consumers.py

import asyncio
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from google.cloud import speech
from . import production_services
from urllib.parse import parse_qs

class RealtimeConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()

        # 1. Read the language code from the connection's query string
        query_string = self.scope.get('query_string', b'').decode()
        params = parse_qs(query_string)
        self.language_code = params.get('language', ['en-US'])[0]

        print(f"Real-time socket connected with language: {self.language_code}")
        
        self.audio_queue = asyncio.Queue()
        self.transcription_task_started = False

    async def disconnect(self, close_code):
        print(f"Real-time socket disconnected with code: {close_code}")
        if self.transcription_task_started:
            await self.audio_queue.put(None)

    async def receive(self, bytes_data):
        # If this is the first audio chunk, start the transcription task
        if not self.transcription_task_started:
            asyncio.create_task(self.transcribe_task())
            self.transcription_task_started = True

        # Add the audio chunk to the queue for processing
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
                model="telephony"
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
                # ... (The rest of this loop is unchanged)
                if not response.results: continue
                result = response.results[0]
                if not result.alternatives: continue

                transcript = result.alternatives[0].transcript

                await self.send(text_data=json.dumps({
                    "type": "transcript",
                    "transcript": transcript,
                    "is_final": result.is_final,
                }))

                if result.is_final and transcript:
                    moderation_feedback = await sync_to_async(
                        production_services.get_moderation_feedback
                    )(transcript)
                    await self.send(text_data=json.dumps({
                        "type": "moderation",
                        "feedback": moderation_feedback
                    }))
        except Exception as e:
            print(f"CRITICAL ERROR in transcription task: {e}")
        finally:
            print("Transcription task finished.")