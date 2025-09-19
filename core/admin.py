from django.contrib import admin
from .models import FilteredPhrase

@admin.register(FilteredPhrase)
class FilteredPhraseAdmin(admin.ModelAdmin):
    list_display = ('offensive_phrase', 'language', 'updated_at')
    list_filter = ('language',)
    search_fields = ('offensive_phrase',)