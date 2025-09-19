
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

# Set the settings module environment variable
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'voiceguard.settings')

# This must be called BEFORE we import our routing.
django_asgi_app = get_asgi_application()

# Now we can safely import our routing
import core.routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            core.routing.websocket_urlpatterns
        )
    ),
})