from rest_framework import viewsets, permissions
from .models import Gecko, CareLog
from .serializers import GeckoSerializer, CareLogSerializer

# 게코 목록 조회, 생성, 수정, 삭제(CRUD)를 한방에 처리
class GeckoViewSet(viewsets.ModelViewSet):
    queryset = Gecko.objects.all().order_by('-created_at') # 최신순 정렬
    serializer_class = GeckoSerializer

# 사육 일지 CRUD
class CareLogViewSet(viewsets.ModelViewSet):
    queryset = CareLog.objects.all().order_by('-log_date')
    serializer_class = CareLogSerializer

class GeckoViewSet(viewsets.ModelViewSet):
    serializer_class = GeckoSerializer
    permission_classes = [permissions.IsAuthenticated] # 🔥 로그인한 사람만 접근 가능하게 변경

    def get_queryset(self):
        # 🔥 관리자면 다 보여주고, 일반 유저는 자기 것만 보여줌
        if self.request.user.is_superuser:
            return Gecko.objects.all()
        return Gecko.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # 🔥 저장할 때 자동으로 현재 로그인한 유저를 주인으로 등록
        serializer.save(user=self.request.user)