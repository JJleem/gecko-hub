from rest_framework import serializers
from .models import Gecko, CareLog

class CareLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = CareLog
        fields = '__all__'  # 모든 필드를 JSON으로 내보냄

class GeckoSerializer(serializers.ModelSerializer):
    # 역참조: 이 게코와 연결된 CareLog들을 같이 보여주고 싶을 때 사용
    # read_only=True: 프론트에서 게코 정보를 수정할 때 로그까지 강제로 수정할 필요 없게 함
    logs = CareLogSerializer(many=True, read_only=True)

    class Meta:
        model = Gecko
        fields = '__all__'