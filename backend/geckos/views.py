from rest_framework import viewsets
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