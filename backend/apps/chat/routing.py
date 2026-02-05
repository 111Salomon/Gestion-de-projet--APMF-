"""
WebSocket URL routing for chat
"""
from django.urls import re_path
from . import consumers

# ✅ CORRECTION : Pattern qui correspond EXACTEMENT au chemin complet
websocket_urlpatterns = [
    re_path(r'^ws/chat/(?P<room_id>\d+)/$', consumers.ChatConsumer.as_asgi()),
]