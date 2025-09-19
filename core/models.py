
from django.db import models

class AnalysisReport(models.Model):
    text_content = models.TextField(help_text="The moderated text content.")
    toxicity_score = models.FloatField(help_text="The toxicity score from the Perspective API.")
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Report for "{self.text_content[:50]}..."'

    class Meta:
        ordering = ['-timestamp']