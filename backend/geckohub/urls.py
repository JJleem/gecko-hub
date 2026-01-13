from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from geckos.views import GeckoViewSet, CareLogViewSet

# 라우터 설정: 자동으로 URL을 만들어줍니다.
router = DefaultRouter()
router.register(r'geckos', GeckoViewSet)  # /api/geckos/
router.register(r'logs', CareLogViewSet)  # /api/logs/

urlpatterns = [
    path('admin/', admin.site.urls),
    # api/ 로 시작하는 주소는 우리가 만든 router가 처리
    path('api/', include(router.urls)),
]

# 이미지 파일 조회를 위한 설정 (개발 모드에서만 작동)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)