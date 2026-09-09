"""
FILE: config/asgi.py
PURPOSE: ASGI entry point for async servers (uvicorn/daphne) — enables
         future websocket support (e.g., real-time emergency alerts).
"""
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
application = get_asgi_application()
