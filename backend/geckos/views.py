from rest_framework import viewsets, permissions
from .models import Gecko, CareLog
from .serializers import GeckoSerializer, CareLogSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from .models import UserSettings
from rest_framework.response import Response
from rest_framework.views import APIView

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
    # 로그인 안 해도 읽기(GET)는 가능, 쓰기/수정(POST/PUT)은 로그인 필수
    permission_classes = [IsAuthenticatedOrReadOnly] 
    
    def get_queryset(self):
        print(f"👉 현재 요청 유저: {self.request.user} (로그인 여부: {self.request.user.is_authenticated})")
        # 1. 상세 조회 (detail page) 요청일 때
        # => id로 특정 개체를 찾는 것이므로, 내 것이 아니어도(전체 DB에서) 찾을 수 있게 해줍니다.
        if self.action == 'retrieve':
            return Gecko.objects.all()
            
        # 2. 목록 조회 (list page) 요청일 때
        # => 로그인한 사람은 '내 개체'만 모아보고, 비회원은 아무것도 안 보여줌
        if self.request.user.is_authenticated:
            return Gecko.objects.filter(user=self.request.user)
        
        # 비회원이 목록을 요청하면 빈 리스트 반환
        return Gecko.objects.none()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

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