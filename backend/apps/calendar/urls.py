from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CalendarViewSet

router = DefaultRouter()
router.register(r'', CalendarViewSet, basename='calendar')

urlpatterns = [
    path('', include(router.urls)),
]
