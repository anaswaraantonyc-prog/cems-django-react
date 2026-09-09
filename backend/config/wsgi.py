"""
FILE: config/wsgi.py
PURPOSE: WSGI entry point for synchronous production servers (gunicorn, etc.)
"""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
application = get_wsgi_application()
