from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CalendarViewSet,
    GoogleCalendarAuthView,
    GoogleCalendarCallbackView,
    GoogleCalendarListView,
    GoogleCalendarSyncView,
    GoogleCalendarSelectView,  # ✨ AJOUTÉ
    GoogleCalendarDisconnectView  # ✨ AJOUTÉ
)

router = DefaultRouter()
router.register(r'', CalendarViewSet, basename='calendar')

urlpatterns = [
    path('', include(router.urls)),
    path('google/auth/', GoogleCalendarAuthView.as_view(), name='google-calendar-auth'),
    path('google/callback/', GoogleCalendarCallbackView.as_view(), name='google-calendar-callback'),
    path('google/sync/', GoogleCalendarSyncView.as_view(), name='google-calendar-sync'),
    path('google/calendars/', GoogleCalendarListView.as_view(), name='google-calendar-list'),
    path('google/select-calendar/', GoogleCalendarSelectView.as_view(), name='google-calendar-select'),  # ✨ AJOUTÉ
    path('google/disconnect/', GoogleCalendarDisconnectView.as_view(), name='google-calendar-disconnect'),  # ✨ AJOUTÉ

]