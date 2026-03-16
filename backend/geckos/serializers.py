from rest_framework import serializers
from .models import Gecko, CareLog
from operator import attrgetter

# 1. 부모/파트너 정보용 미니 시리얼라이저
class ParentGeckoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gecko
        fields = ['id', 'name', 'profile_image', 'gender','morph'] 

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
            'sire_name', 'dam_name',
            'logs', 
            'is_ovulating',
            'tail_loss', 'mbd', 'has_spots',
            'acquisition_type', 'acquisition_source', 
            'weight',
        ]

    # 🔥 [추가] 개체 생성 시, 입력한 몸무게가 있으면 자동으로 로그 추가
    def create(self, validated_data):
        # 1. 개체 생성
        gecko = super().create(validated_data)
        
        # 2. 초기 몸무게가 있으면 사육일지(CareLog)에 자동 기록
        if gecko.weight:
            CareLog.objects.create(
                gecko=gecko,
                log_type='Weight',
                weight=gecko.weight,
                log_date=gecko.created_at.date(), # 생성된 날짜 기준
                note='초기 등록 몸무게'
            )
        
        return gecko

    # [로그 가져오기 함수]
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