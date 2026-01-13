from rest_framework import serializers
from .models import Gecko, CareLog
from operator import attrgetter

# 1. 부모/파트너 정보용 미니 시리얼라이저
class ParentGeckoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gecko
        fields = ['id', 'name', 'profile_image', 'gender'] 

# 2. 사육 기록 시리얼라이저
class CareLogSerializer(serializers.ModelSerializer):
    # 파트너 정보 (상대방)
    partner_detail = ParentGeckoSerializer(source='partner', read_only=True)
    # 기록 작성자 정보 (내가 파트너일 때, 누가 기록했는지 알아야 함)
    gecko_detail = ParentGeckoSerializer(source='gecko', read_only=True)

    class Meta:
        model = CareLog
        fields = '__all__'

# 3. 게코 메인 시리얼라이저
class GeckoSerializer(serializers.ModelSerializer):
    # logs를 커스텀 함수로 대체합니다.
    logs = serializers.SerializerMethodField()
    
    sire_detail = ParentGeckoSerializer(source='sire', read_only=True)
    dam_detail = ParentGeckoSerializer(source='dam', read_only=True)

    class Meta:
        model = Gecko
        fields = [
            'id', 'name', 'morph', 'gender', 'birth_date', 
            'description', 'profile_image', 'created_at', 
            'sire', 'dam', 
            'sire_detail', 'dam_detail', 
            'logs', 
            'is_ovulating'
        ]

    # 🔥 [중요] 이 함수는 반드시 클래스 안쪽으로 들여쓰기가 되어 있어야 합니다!
    def get_logs(self, obj):
        # 1. 내가 쓴 기록
        my_logs = obj.logs.all() 
        # 2. 내가 파트너로 지목된 기록
        partner_logs = obj.mating_logs.all()
        
        # 3. 합치기
        combined_logs = list(my_logs) + list(partner_logs)
        
        # 4. 정렬 (날짜 -> ID 등록순)
        combined_logs.sort(key=attrgetter('log_date', 'id'), reverse=True)
        
        return CareLogSerializer(combined_logs, many=True).data