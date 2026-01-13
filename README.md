# 🦎 GeckoHub (게코허브)

**크레스티드 게코 집사들을 위한 혈통 관리 및 사육 기록 서비스**

GeckoHub는 개체의 혈통(Lineage)을 시각적으로 파악하고, 성장 과정(무게, 피딩, 탈피)을 체계적으로 기록하기 위해 시작된 프로젝트입니다.

## 📅 프로젝트 목표

- **혈통 관리:** 부모 개체 정보를 연결하여 가계도 파악 (Self-referencing relationship)
- **성장 기록:** 일자별 체중 변화 및 피딩 여부 기록
- **미디어 저장:** 성장 과정을 담은 사진 갤러리

## 🛠 Tech Stack

### Frontend

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Deployment:** Vercel (예정)

### Backend

- **Framework:** Django 5, Django REST Framework (DRF)
- **Database:** SQLite (Dev) -> PostgreSQL (Prod 예정)
- **Environment:** Python 3.x

## 🚀 Getting Started

### 1. Backend (Django)

```bash
cd geckohub
# 가상환경 실행
source venv/bin/activate  # Windows: venv\Scripts\activate
# 서버 실행
python manage.py runserver
```
