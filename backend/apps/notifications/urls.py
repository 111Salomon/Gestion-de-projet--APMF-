"""URLs pour les notifications."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet


# Router automatique pour les endpoints REST
router = DefaultRouter()
router.register(r'', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]
