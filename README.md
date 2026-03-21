<div align="center">

# 🦎 GeckoHub

**크레스티드 게코 브리더를 위한 개체 통합 관리 웹 앱**

개체 프로필 · 사육일지 · 혈통 트리 · 인큐베이터 · 유전자 계산기를 한 곳에서.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-geckohub.vercel.app-4ade80?style=for-the-badge&logo=vercel&logoColor=white)](https://geckohub.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Django](https://img.shields.io/badge/Django-5.1-092E20?style=for-the-badge&logo=django)](https://www.djangoproject.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)

</div>

---

## ✨ 소개

GeckoHub는 크레스티드 게코(Crested Gecko) 브리더를 위해 만든 개체 통합 관리 웹 애플리케이션입니다.

한 마리 한 마리의 **성장 기록, 혈통, 번식 현황**을 체계적으로 관리하고, 피딩부터 부화까지 브리딩의 모든 과정을 추적할 수 있습니다.

---

## 🖥️ 주요 기능

### 🏠 홈 대시보드
- **Today Card** — 오늘 날짜, 피딩 완료 현황, 빠른 피딩 기록 버튼
- **Week Calendar Strip** — 이번 주 7일 뷰, 피딩 🦗 / 산란 🥚 인디케이터
- **통계 위젯** — 전체 마릿수, 수컷/암컷 비율, 배란중 암컷, 인큐베이터 현황
- **4열 게코 카드 그리드** — 프로필 이미지, 모프, 성별, 체중, 퀵 액션

### 🦎 개체 관리 (CRUD)
- 이름, 모프, 성별, 생년월일, 체중, 프로필 사진 (Cloudinary)
- 부모 혈통 (Sire / Dam) 등록 — 목록 선택 또는 외부 이름 직접 입력
- 출처 구분 — 직접 해칭 🥚 / 샵 구매 🏪 / 구조 🫶, 출처명 기록
- 건강 상태 플래그 — 배란중 (Ovulating), 꼬리 부절 (Tail Loss), MBD
- Zustand 전역 캐시 (3분 TTL, localStorage 영속화)

### 📓 사육일지 (Care Logs)

7가지 일지 타입으로 모든 사육 기록을 체계적으로 관리

| 타입 | 기록 내용 |
|------|-----------|
| 🦗 피딩 | 먹이 종류, 메모 |
| ⚖️ 체중 | 무게 (g) |
| 💞 메이팅 | 파트너, 성공/실패 여부 |
| 🥚 산란 | 알 개수, 유정란 여부, 알 상태 |
| 🐍 탈피 | 일자, 메모 |
| 🧹 청소 | 일자, 메모 |
| 📝 기타 | 자유 메모 |

### 🌿 혈통 트리 (Lineage Tree)
- `@xyflow/react` 기반 인터랙티브 혈통 시각화
- **3단 계층** — 부모(위) → 현재 개체(중간) → 자녀(아래)
- 파란 엣지 = Sire, 핑크 엣지 = Dam, 초록 엣지 = 자녀
- 노드 클릭 시 해당 개체 상세 페이지로 이동

### 🥚 인큐베이터 관리
- 진행 중인 모든 유정란 한 번에 조회
- 예상 해칭일 **D-day 카운트다운**
- 인큐베이션 **진행률 프로그레스 바**
- 온도, 예상 모프 기록

### 🧬 유전자 계산기
- **퍼넷 스퀘어 (Punnett Square)** 방식 모프 조합 계산
- 부모 모프 선택 → 자녀 출현 확률 자동 계산
- 64종 이상의 크레스티드 게코 모프 지원

### 📊 체중 추이 그래프
- `Recharts` 기반 날짜별 체중 꺾은선 그래프
- 성장 패턴 시각적 추적

### 📅 사육 캘린더
- 월별 캘린더 뷰로 전체 사육 이벤트 한눈에 보기
- 피딩 / 산란 / 탈피 / 체중 등 종류별 색상 구분

### 🍽️ 피딩 퀵 패널
- 게코 카드에서 원클릭으로 피딩 기록
- 먹이 종류 칩 선택 (귀뚜라미, 두비아, CGD 등)
- **다음에도 기억하기** — localStorage에 먹이 선택 저장

### 🖼️ 게코 카드 PNG 저장
- 게코 프로필을 카드 이미지로 다운로드 (`html-to-image`)
- 이름, 모프, 생년월일, 체중, 나이, 출처, 부모 정보, 건강 상태 포함
- 고해상도 (2.5× pixel ratio), GeckoHub 브랜딩 포함

### 📸 사진 갤러리 & 라이트박스
- 개체당 최대 3장의 갤러리 사진 추가 (Cloudinary)
- 대표사진 변경
- 클릭 시 전체화면 라이트박스 — 키보드 방향키 / ESC 지원

---

## 🛠 기술 스택

### Frontend

| 분류 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | TailwindCSS v4 + shadcn/ui (Radix UI 기반) |
| Font | Nunito (Google Fonts) |
| State | Zustand v5 (localStorage 영속화, 3분 TTL 캐시) |
| Auth | NextAuth.js v4 (Google OAuth, Kakao OAuth) |
| Chart | Recharts v3 |
| Tree | @xyflow/react v12 |
| Form | react-hook-form v7 |
| Toast | Sonner v2 |
| Image Export | html-to-image |

### Backend

| 분류 | 기술 |
|------|------|
| Framework | Django 5.1.4 + Django REST Framework 3.15 |
| Auth | djangorestframework-simplejwt |
| DB | PostgreSQL (프로덕션) / SQLite (로컬) |
| Image Storage | Cloudinary (django-cloudinary-storage) |
| CORS | django-cors-headers |

### Infrastructure

| 분류 | 기술 |
|------|------|
| Frontend Deploy | Vercel |
| Image CDN | Cloudinary |
| Auth Provider | Google, Kakao |

---

## 📁 프로젝트 구조

```
gecko-hub/
├── frontend/geckohub-web/
│   └── app/
│       ├── page.tsx                    # 홈 대시보드
│       ├── calendar/page.tsx           # 사육 캘린더
│       ├── incubator/page.tsx          # 인큐베이터 관리
│       ├── calculator/page.tsx         # 유전자 계산기
│       ├── geckos/
│       │   ├── new/page.tsx            # 개체 등록
│       │   └── [id]/
│       │       ├── page.tsx            # 개체 상세
│       │       └── edit/page.tsx       # 개체 수정
│       ├── components/
│       │   ├── GeckoDetailTabs.tsx     # 상세 탭 (개요/성장/관계도)
│       │   ├── GeckoShareCard.tsx      # PNG 카드 컴포넌트
│       │   ├── GeckoPhotoGallery.tsx   # 갤러리 + 라이트박스
│       │   ├── LogForm.tsx             # 사육일지 입력 폼
│       │   ├── WeightChart.tsx         # 체중 추이 그래프
│       │   ├── EggTracker.tsx          # 산란 기록
│       │   ├── MatingTracker.tsx       # 메이팅 타임라인
│       │   ├── IncubationSection.tsx   # 인큐베이팅 현황
│       │   ├── LineageTree.tsx         # 혈통 트리 (React Flow)
│       │   ├── MorphModal.tsx          # 모프 선택 모달
│       │   └── layout/
│       │       ├── main-nav.tsx        # 헤더 네비게이션
│       │       └── footer.tsx          # 푸터
│       ├── stores/
│       │   └── geckoStore.ts           # Zustand 전역 캐시 스토어
│       ├── types/gecko.ts              # TypeScript 타입 정의
│       ├── utils/morphCalculator.ts    # 유전자 계산 로직
│       ├── constants/morphs.ts         # 모프 상수
│       ├── sitemap.ts                  # 자동 사이트맵
│       └── robots.ts                   # robots.txt
│
└── backend/
    ├── geckos/
    │   ├── models.py                   # Gecko, CareLog, GeckoPhoto
    │   ├── views.py                    # ViewSet (CRUD + 커스텀 액션)
    │   ├── serializers.py              # DRF Serializer
    │   └── urls.py                     # API 라우터
    └── config/
        └── settings.py                 # Django 설정
```

---

## 🗄 데이터 모델

```
Gecko
├── 기본 정보: name, morph, gender, birth_date, weight
├── 이미지: profile_image (Cloudinary)
├── 출처: acquisition_type (Hatched/Purchased/Rescue), acquisition_source
├── 혈통: sire (FK→self), dam (FK→self), sire_name, dam_name
├── 건강: is_ovulating, tail_loss, mbd, has_spots
└── user (FK→User)

CareLog
├── gecko (FK→Gecko)
├── log_type: Feeding/Weight/Mating/Laying/Shedding/Cleaning/Etc
├── log_date, weight, note, image
├── 메이팅: partner (FK→Gecko), mating_success
└── 산란: egg_count, is_fertile, egg_condition,
         incubation_temp, expected_hatching_date, expected_morph

GeckoPhoto
├── gecko (FK→Gecko)
└── image (Cloudinary)
```

---

## 🔐 인증 플로우

```
사용자
  → Google / Kakao OAuth 로그인
  → NextAuth.js 콜백
  → Django /api/auth/social/ 으로 소셜 토큰 전달
  → JWT (Access Token) 발급
  → 이후 모든 API 요청: Authorization: Bearer {token}
```

---

## ⚡ 캐시 전략

```
첫 로드   → API 호출 → Zustand store 저장 + localStorage 영속화
재방문    → localStorage 복원 → 즉시 렌더 (API 호출 없음)
3분 경과  → stale 판정 → 백그라운드 재 fetch
CRUD 발생 → 캐시 강제 무효화 → 재 fetch
로그아웃  → 캐시 전체 초기화
```

---

## ♿ 웹 접근성 (Accessibility)

- **Skip link** — 키보드 사용자용 "본문 바로가기" 링크
- **focus-visible** — 키보드 탐색 시에만 포커스 링 표시 (마우스 클릭 시 숨김)
- **aria-current="page"** — 현재 페이지 네비게이션 표시
- **aria-pressed** — 토글 버튼 (성별 필터, 먹이 칩, 일지 필터)
- **role="dialog" + aria-modal** — 라이트박스, 모달 접근성
- **aria-live** — 라이트박스 사진 인덱스 실시간 업데이트
- **sr-only label** — 검색 input, 직접입력 필드 스크린리더 지원
- **aria-label** — 아이콘 전용 버튼 전체 설명 제공
- **aria-hidden** — 장식용 아이콘/이미지 스크린리더 제외
- **Semantic HTML** — `<header>`, `<main>`, `<nav>`, `<footer>` landmark

---

## 🔍 SEO

- `metadataBase` + 페이지별 `metadata` (title template, description, keywords)
- **Open Graph** — 소셜 공유 미리보기 (og:title, og:description, og:image)
- **Twitter Card** — summary_large_image 포맷
- **sitemap.ts** — 정적 페이지 자동 사이트맵 생성
- **robots.ts** — 크롤러 정책 설정

---

## 🚀 로컬 실행

### Frontend

```bash
cd frontend/geckohub-web
npm install
cp .env.example .env.local   # 환경변수 설정
npm run dev
```

**필요한 환경 변수 (`.env.local`)**

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret

NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # 환경변수 설정
python manage.py migrate
python manage.py runserver
```

---

## 📌 개발 로드맵

- [x] 게코 CRUD (등록 / 수정 / 삭제)
- [x] 사육일지 7가지 타입
- [x] 혈통 트리 시각화 (React Flow)
- [x] 인큐베이터 관리 (D-day, 진행바)
- [x] 유전자 계산기 (퍼넷 스퀘어)
- [x] 체중 추이 그래프 (Recharts)
- [x] 사진 갤러리 + 라이트박스
- [x] 사육 캘린더 (월별 뷰)
- [x] 게코 필터 & 검색 (이름 / 모프 / 성별)
- [x] 게코 카드 PNG 저장 (html-to-image)
- [x] 피딩 퀵 패널 (먹이 선택 + 기억하기)
- [x] 홈 통계 대시보드 + 주간 캘린더
- [x] 내추럴 미니멀 디자인 (Nunito 폰트, warm oklch 컬러)
- [x] 웹 접근성 (a11y) 전면 적용
- [x] SEO (메타태그, Open Graph, sitemap, robots)
- [ ] 피딩 알림 푸시 (Web Push / PWA)
- [ ] 번식 시즌 관리 (연도별 통계)
- [ ] 판매 기록 관리

---

## 👤 만든 사람

**JJleem**

[![GitHub](https://img.shields.io/badge/GitHub-@JJleem-181717?style=flat-square&logo=github)](https://github.com/JJleem)

---

<div align="center">

Made with 🌿 for Crested Gecko breeders

</div>
