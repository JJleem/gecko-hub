from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

@api_view(['POST'])
@permission_classes([AllowAny])
def social_login(request):
    # 1. 프론트엔드에서 보낸 데이터 받기
    provider = request.data.get('provider')
    email = request.data.get('email')
    name = request.data.get('name')

    if not email:
        return Response({'error': '이메일 정보가 없습니다.'}, status=400)

    try:
        # 2. 이미 가입된 유저인지 확인
        user = User.objects.get(username=email)
    except User.DoesNotExist:
        # 3. 없으면 회원가입 처리
        user = User.objects.create_user(username=email, email=email)
        user.first_name = name if name else "이름 없음"
        user.save()

    # 4. Django 전용 JWT 토큰 발급
    refresh = RefreshToken.for_user(user)

    return Response({
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'user_id': user.id,
        'username': user.first_name
    })