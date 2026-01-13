from rest_framework import serializers
from .models import Gecko, CareLog

# 1. 부모 정보용 간단한 시리얼라이저 추가 (Main 시리얼라이저 위에 작성)
class ParentGeckoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gecko
        fields = ['id', 'name', 'profile_image']

class CareLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = CareLog
        fields = '__all__'

class GeckoSerializer(serializers.ModelSerializer):
    logs = CareLogSerializer(many=True, read_only=True)
    
    # 2. 읽기 전용(read_only)으로 부모 상세 정보 필드 추가
    # source='sire'는 이 필드가 모델의 sire 데이터를 가져온다는 뜻입니다.
    sire_detail = ParentGeckoSerializer(source='sire', read_only=True)
    dam_detail = ParentGeckoSerializer(source='dam', read_only=True)

    class Meta:
        model = Gecko
        # 3. fields에 *_detail 추가
        fields = [
            'id', 'name', 'morph', 'gender', 'birth_date', 
            'description', 'profile_image', 'created_at', 
            'sire', 'dam',             # 글 쓸 때 필요한 ID (기존 유지)
            'sire_detail', 'dam_detail', # 보여줄 때 필요한 상세 정보 (추가)
            'logs'
        ]