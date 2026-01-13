from django.db import models

class Gecko(models.Model):
    # 선택지 정의 (성별)
    GENDER_CHOICES = (
        ('Male', '수컷'),
        ('Female', '암컷'),
        ('Unknown', '미구분'),
    )

    # 기본 정보
    name = models.CharField(max_length=50, verbose_name="이름")
    weight = models.FloatField(null=True, blank=True)
    morph = models.CharField(max_length=100, blank=True, verbose_name="모프")
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='Unknown', verbose_name="성별")
    birth_date = models.DateField(null=True, blank=True, verbose_name="해칭일(생일)")
    adoption_date = models.DateField(null=True, blank=True, verbose_name="입양일")
    is_ovulating = models.BooleanField(default=False)
    # 이미지 (media/gecko_profiles 폴더에 저장됨)
    profile_image = models.ImageField(upload_to='gecko_profiles/', null=True, blank=True, verbose_name="프로필 사진")
    
    # 설명/메모
    description = models.TextField(blank=True, verbose_name="특이사항")

    tail_loss = models.BooleanField(default=False) # 꼬리 부절 여부
    mbd = models.BooleanField(default=False)       # MBD 여부
    has_spots = models.BooleanField(default=False) # 점(Spots) 유무

    # ⭐ 핵심: 혈통 (자기 자신을 참조하는 1:N 관계)
    # on_delete=models.SET_NULL: 부모가 DB에서 삭제돼도 자식은 안 지워지고 부모란만 비워짐
    sire = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='sire_children', verbose_name="부(아빠)")
    dam = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='dam_children', verbose_name="모(엄마)")
    sire_name = models.CharField(max_length=50, blank=True, null=True)
    dam_name = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    ACQUISITION_CHOICES = [
        ('Purchased', '입양 (분양)'),
        ('Hatched', '직접 해칭 (Self-Hatched)'),
        ('Rescue', '구조/기타'),
    ]
    acquisition_type = models.CharField(
        max_length=20, 
        choices=ACQUISITION_CHOICES, 
        default='Purchased'
    )
    acquisition_source = models.CharField(max_length=100, blank=True, null=True) # 입양처 (샵/브리더 이름)

    def __str__(self):
        return self.name  # 관리자 페이지에서 이름으로 표시됨

# 사육 일지 (몸무게, 피딩 등)
class CareLog(models.Model):
    LOG_TYPE_CHOICES = (
        ('Feeding', '피딩'),
        ('Weight', '체중측정'),
        ('Shedding', '탈피'),
        ('Cleaning', '청소'),
        ('Etc', '기타'),
        ('Laying', 'Laying'),
        ('Mating', 'Mating'),
    )

    # 어떤 게코의 기록인지 연결 (Gecko가 삭제되면 기록도 같이 삭제: CASCADE)
    gecko = models.ForeignKey(Gecko, on_delete=models.CASCADE, related_name='logs')
    log_date = models.DateField(verbose_name="기록 날짜")
    log_type = models.CharField(max_length=20, choices=LOG_TYPE_CHOICES, default='Feeding')
    weight = models.FloatField(null=True, blank=True, verbose_name="무게(g)")
    note = models.TextField(blank=True, verbose_name="메모")
    egg_count = models.IntegerField(null=True, blank=True) # 알 개수 (1 or 2)
    is_fertile = models.BooleanField(default=False)        # 유정란 여부 (True: 유정, False: 무정)
    egg_condition = models.CharField(max_length=100, blank=True) # 알 상태 (눈꽃, 찌그러짐 등)
    # 기록용 사진
    image = models.ImageField(upload_to='care_logs/', null=True, blank=True)
    partner = models.ForeignKey('Gecko', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='mating_logs')
    partner_name = models.CharField(max_length=50, blank=True, null=True)
    mating_success = models.BooleanField(default=False) # 성공/실패 여부
    incubation_temp = models.FloatField(null=True, blank=True) # 세팅 온도 (예: 24.5)
    expected_hatching_date = models.DateField(null=True, blank=True) # 해칭 예정일
    expected_morph = models.CharField(max_length=200, blank=True, null=True)
    def __str__(self):
        return f"{self.gecko.name} - {self.log_type} ({self.log_date})"