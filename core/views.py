# core/views.py
import os
from django.shortcuts import render
from .models import AnalysisReport
from . import production_services

def get_firebase_config():
    """Helper function to get Firebase config from environment."""
    return {
        "apiKey": os.getenv("FIREBASE_API_KEY"),
        "authDomain": os.getenv("FIREBASE_AUTH_DOMAIN"),
        "databaseURL": os.getenv("FIREBASE_DATABASE_URL"),
        "projectId": os.getenv("FIREBASE_PROJECT_ID"),
        "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET"),
        "messagingSenderId": os.getenv("FIREBASE_MESSAGING_SENDER_ID"),
        "appId": os.getenv("FIREBASE_APP_ID"),
    }

def home(request):
    # ... (this view is unchanged)
    analysis_result = None
    if request.method == 'POST' and request.FILES.get('audio_file'):
        audio_file = request.FILES['audio_file']
        analysis_result = production_services.analyze_uploaded_file(audio_file)
    return render(request, 'core/home.html', {'result': analysis_result})

def reports_page(request):
    # ... (this view is unchanged)
    reports = AnalysisReport.objects.all()
    return render(request, 'core/reports.html', {'reports': reports})

def login_page(request):
    # ... (this view is unchanged)
    return render(request, 'core/login.html', {'firebase_config': get_firebase_config()})
    
# NEW, SIMPLIFIED VIEW FOR THE CALL PAGE
def call_page(request):
    """Renders the single-page call interface."""
    return render(request, 'core/realtime_call.html', {
        'firebase_config': get_firebase_config()
    })

def realtime_page(request):
    return render(request, 'core/realtime.html')