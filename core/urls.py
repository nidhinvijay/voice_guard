# core/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('realtime/', views.realtime_page, name='realtime'),
    path('reports/', views.reports_page, name='reports'),
]