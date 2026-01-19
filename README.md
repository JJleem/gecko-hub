# 🦎 GeckoHub (게코허브)

**크레스티드 게코 집사들을 위한 스마트 혈통 관리 및 사육 기록 서비스**

> **Current Status:** 🚀 MVP Deployed (Vercel)

GeckoHub는 개체의 혈통을 시각적으로 파악하고, 성장 과정(무게, 피딩, 메이팅)을 체계적으로 기록하기 위해 개발된 웹 애플리케이션입니다.

---

## 📅 주요 기능 (Key Features)

- **🧬 혈통 관리 (Lineage):** 부모(Sire/Dam) 개체를 연결하여 가계도를 시각적으로 파악 (Self-referencing relationship)
- **📊 성장 기록 (Tracking):** 일자별 체중 변화, 피딩 여부, 산란 및 해칭 기록 관리
- **🔐 소셜 로그인 (Auth):** Google, Kakao 로그인을 통한 간편 인증 (NextAuth + Django JWT)
- **☁️ 미디어 클라우드:** 개체 프로필 사진 및 성장 앨범 Cloudinary 연동 저장
- **📱 반응형 웹:** PC 및 모바일 환경 최적화 (진행 중)

---

## 🛠 Tech Stack

### 🎨 Frontend

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Authentication:** NextAuth.js (v4)
- **Deployment:** Vercel

### ⚙️ Backend

- **Framework:** Django 5, Django REST Framework (DRF)
- **Language:** Python
- **Authentication:** dj-rest-auth, simplejwt (JWT)
- **Deployment:** Vercel (Serverless Function)

### 🏗️ Infrastructure

- **Database:** Supabase (PostgreSQL)
  - _Note: Connection Pooling (Transaction Mode) 적용_
- **Storage:** Cloudinary (Media Hosting)
- **Version Control:** GitHub

---

## 🚀 Getting Started

### 1. Backend (Django)

```bash
cd backend

# 가상환경 생성 및 실행
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 패키지 설치
pip install -r requirements.txt

# 환경변수 설정 (.env 파일 생성)
# DATABASE_URL, CLOUDINARY_*, SECRET_KEY 등 설정 필요

# 마이그레이션 및 실행
python manage.py migrate
python manage.py runserver
```
