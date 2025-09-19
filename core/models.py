
from django.db import models

class FilteredPhrase(models.Model):
    
    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('ml', 'Malayalam'),
        ('hi', 'Hindi'),
    ]

    offensive_phrase = models.CharField(max_length=255, unique=True, help_text="The disrespectful word or phrase.")
    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default='en')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'"{self.offensive_phrase}" -> "{self.polite_suggestion}" ({self.get_language_display()})'

    class Meta:
        ordering = ['offensive_phrase']

class AnalysisReport(models.Model):
    text_content = models.TextField(help_text="The moderated text content.")
    toxicity_score = models.FloatField(help_text="The toxicity score from the Perspective API.")
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Report for "{self.text_content[:50]}..."'

    class Meta:
        ordering = ['-timestamp']