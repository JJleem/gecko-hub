from django.contrib import admin
from .models import Gecko, CareLog

# 관리자 페이지에 모델 등록
admin.site.register(Gecko)
admin.site.register(CareLog)