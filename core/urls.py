# core/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('realtime/', views.realtime_page, name='realtime'),
    path('reports/', views.reports_page, name='reports'),
    path('login/', views.login_page, name='login'),
    path('call/', views.realtime_call_page, name='call'),
]