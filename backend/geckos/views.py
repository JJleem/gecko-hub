from rest_framework import viewsets, permissions, serializers as drf_serializers
from rest_framework.decorators import action
from django.db.models import Prefetch
from .models import Gecko, CareLog, GeckoPhoto
from .serializers import GeckoSerializer, CareLogSerializer, GeckoPhotoSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from .models import UserSettings
from rest_framework.response import Response
from rest_framework.views import APIView

def _gecko_queryset_with_prefetch():
    log_qs = CareLog.objects.select_related('partner', 'gecko')
    child_qs = Gecko.objects.only('id', 'name', 'profile_image', 'morph', 'gender')
    return Gecko.objects.select_related('sire', 'dam').prefetch_related(
        Prefetch('logs', queryset=log_qs),
        Prefetch('mating_logs', queryset=log_qs),
        Prefetch('sire_children', queryset=child_qs),
        Prefetch('dam_children', queryset=child_qs),
    )

class GeckoViewSet(viewsets.ModelViewSet):
    serializer_class = GeckoSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # 상세 조회(retrieve)는 전체 DB에서 탐색 (혈통 링크 지원)
        if self.action == 'retrieve':
            return _gecko_queryset_with_prefetch()

        # 목록 조회는 내 개체만, 비회원은 빈 리스트
        if self.request.user.is_authenticated:
            return _gecko_queryset_with_prefetch().filter(user=self.request.user)
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

class GeckoPhotoViewSet(viewsets.ModelViewSet):
    serializer_class = GeckoPhotoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return GeckoPhoto.objects.filter(gecko__user=self.request.user)

    def perform_create(self, serializer):
        gecko_id = self.request.data.get('gecko')
        try:
            gecko = Gecko.objects.get(id=gecko_id, user=self.request.user)
        except Gecko.DoesNotExist:
            raise drf_serializers.ValidationError("게코를 찾을 수 없습니다.")
        if gecko.photos.count() >= 3:
            raise drf_serializers.ValidationError("추가 사진은 최대 3장까지 업로드할 수 있습니다.")
        serializer.save(gecko=gecko)

    @action(detail=True, methods=['post'])
    def set_primary(self, request, pk=None):
        photo = self.get_object()
        gecko = photo.gecko
        old_image_name = gecko.profile_image.name if gecko.profile_image else None
        # 이 사진을 대표사진으로
        gecko.profile_image = photo.image.name
        gecko.save()
        # 기존 대표사진을 이 슬롯에 보존
        if old_image_name:
            photo.image = old_image_name
            photo.save()
        else:
            photo.delete()
        return Response(GeckoSerializer(gecko).data)


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