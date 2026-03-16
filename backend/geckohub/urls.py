from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
# 🔥 1. UserSettingsView 임포트 추가
from geckos.views import GeckoViewSet, CareLogViewSet, UserSettingsView 

# 라우터 설정
router = DefaultRouter()
router.register(r'geckos', GeckoViewSet, basename='gecko')  # /api/geckos/
router.register(r'logs', CareLogViewSet)  # /api/logs/

urlpatterns = [
    path('admin/', admin.site.urls),
    
    
    path('api/settings/', UserSettingsView.as_view(), name='user-settings'),

    # api/ 로 시작하는 나머지 주소(geckos, logs)는 라우터가 처리
    path('api/', include(router.urls)),
    path('api/auth/', include('users.urls')),
]

# 이미지 파일 조회를 위한 설정
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)