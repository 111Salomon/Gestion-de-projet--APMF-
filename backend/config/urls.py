from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

"""
Configuration des URLs principales du projet.

Structure:
    /admin/                     Interface d'administration Django
    /api/token/                 Obtenir un token JWT (login)
    /api/token/refresh/         Rafraîchir le token JWT
    /api/users/                 API Users
    /api/projects/              API Projects
    /api/tasks/                 API Tasks
    /api/comments/              API Comments
    /api/attachments/           API Attachments
"""

urlpatterns = [
    # Interface d'administration Django
    path('admin/', admin.site.urls),
    
    # Authentification JWT
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # API REST
    path('api/users/', include('apps.users.urls')),
    path('api/projects/', include('apps.projects.urls')),
    path('api/', include('apps.tasks.urls')),  # tasks, comments, attachments
]

# Servir les fichiers media en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
