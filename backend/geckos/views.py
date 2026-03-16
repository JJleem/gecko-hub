from rest_framework import viewsets, permissions
from .models import Gecko, CareLog
from .serializers import GeckoSerializer, CareLogSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from .models import UserSettings
from rest_framework.response import Response
from rest_framework.views import APIView


class GeckoViewSet(viewsets.ModelViewSet):
    serializer_class = GeckoSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # 상세 조회(retrieve)는 전체 DB에서 탐색 (혈통 링크 지원)
        if self.action == 'retrieve':
            return Gecko.objects.all()

        # 목록 조회는 내 개체만, 비회원은 빈 리스트
        if self.request.user.is_authenticated:
            return Gecko.objects.filter(user=self.request.user)
        return Gecko.objects.none()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CareLogViewSet(viewsets.ModelViewSet):
    serializer_class = CareLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # 내 게코에 속한 로그만 접근 가능
        return CareLog.objects.filter(
            gecko__user=self.request.user
        ).order_by('-log_date')

class UserSettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated] # 로그인 필수

    def get(self, request):
        # 없으면 생성하고, 있으면 가져오기 (Get or Create)
        settings, created = UserSettings.objects.get_or_create(user=request.user)
        return Response({'feeding_days': settings.feeding_days})

    def post(self, request):
        settings, created = UserSettings.objects.get_or_create(user=request.user)
        # 프론트에서 보낸 배열 저장
        settings.feeding_days = request.data.get('feeding_days', [])
        settings.save()
        return Response({'status': 'success', 'feeding_days': settings.feeding_days})