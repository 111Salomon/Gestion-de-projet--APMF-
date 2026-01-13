from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, public_stats 

# ═══════════════════════════════════════════════════════════════
# 🔧 CONFIGURATION DU ROUTER
# ═══════════════════════════════════════════════════════════════

router = DefaultRouter()
router.register(r'', ProjectViewSet, basename='project')

# ═══════════════════════════════════════════════════════════════
# 📊 ROUTES ANALYTICS GLOBALES (en dehors du router)
# ═══════════════════════════════════════════════════════════════

urlpatterns = [

    # 🆕 ROUTE PUBLIQUE (avant les routes du router)
    path('public/stats/', public_stats, name='public-stats'),
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
