# core/routing.py
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # This pattern correctly captures the call_id, including hyphens
    re_path(r'ws/realtime/(?P<call_id>[^/]+)/$', consumers.RealtimeConsumer.as_asgi()),
]