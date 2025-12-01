from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet

# ═══════════════════════════════════════════════════════════════
# 🔧 CONFIGURATION DU ROUTER
# ═══════════════════════════════════════════════════════════════

router = DefaultRouter()
router.register(r'', ProjectViewSet, basename='project')

# ═══════════════════════════════════════════════════════════════
# 📊 ROUTES ANALYTICS GLOBALES (en dehors du router)
# ═══════════════════════════════════════════════════════════════

urlpatterns = [
    # Routes du ViewSet (CRUD + actions custom)
    path('', include(router.urls)),
    
    # 🆕 AJOUTÉ : Routes analytics globales
    path(
        'analytics/team-comparison/',
        ProjectViewSet.as_view({'get': 'team_comparison'}),
        name='analytics-team-comparison'
    ),
    path(
        'analytics/productivity/',
        ProjectViewSet.as_view({'get': 'productivity_trends'}),
        name='analytics-productivity'
    ),
]
