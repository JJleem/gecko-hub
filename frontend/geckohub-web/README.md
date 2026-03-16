# GeckoHub

크레스티드 게코 개체 관리 웹

개체 프로필, 성장 기록, 메이팅/산란 추적, 인큐베이팅 현황, 혈통 관계도를 한 곳에서 관리합니다.

**Live →** [geckohub.vercel.app](https://geckohub.vercel.app)

---

## Tech Stack

| 분류          | 기술                              |
| ------------- | --------------------------------- |
| Framework     | Next.js 16 (App Router)           |
| Language      | TypeScript                        |
| Styling       | TailwindCSS v4                    |
| UI Components | shadcn/ui + Radix UI              |
| Auth          | NextAuth.js v4 (Google OAuth)     |
| State         | Zustand (+ localStorage persist)  |
| Charts        | Recharts                          |
| Lineage Tree  | @xyflow/react (React Flow)        |
| Toast         | Sonner                            |
| Backend       | Django REST Framework (별도 레포) |
| Deployment    | Vercel                            |

---

## Features

### 인증

- Google OAuth 소셜 로그인
- Django JWT 토큰 만료 시 자동 로그아웃
- 로그아웃 시 전역 캐시 초기화

### 홈 대시보드

- 전체 개체 목록 카드 그리드 (프로필 이미지, 모프, 성별, 몸무게)
- 요약 통계 바 — 총 게코 수 / 부화 중인 알 수 / 오늘 피딩 수
- 인큐베이터 현황 위젯 (진행 중인 알 D-day 프로그레스 바)
- 다크모드 완전 지원
- Zustand 전역 캐시로 재방문 시 즉시 렌더 (3분 stale-while-revalidate)

### 개체 등록 / 수정 / 삭제

- 이름, 모프, 성별, 생년월일, 몸무게, 프로필 이미지 업로드
- 부모 혈통 (Sire / Dam) 등록 — 목록에서 선택 또는 이름 직접 입력
- 입양 구분 (직접 해칭 / 분양 / 구조), 출처 기록
- 특이사항 (꼬리 부절, MBD 이력, 달마시안 점), 메모
- 모프 선택 모달 (Tremper / Bell / Rainwater / Mack Snow 등 체계 분류)
- 배란중(Ovulating) / 발정기(Rut) 뱃지 표시
- 등록/수정/삭제 후 캐시 자동 무효화

### 개체 상세 페이지 (탭 구조)

**탭 1 — 개요**

- 진행 중인 인큐베이팅 섹션 (남은 일수 + 프로그레스 바)
- 부모 혈통 카드 (Sire / Dam, 등록된 개체는 클릭 이동)
- 입양 상세 카드
- 메이팅 기록 타임라인 (MatingTracker)

**탭 2 — 성장 기록**

- 체중 추이 꺾은선 그래프 (Recharts)
- 산란 기록 목록 (EggTracker) — 암컷 전용
- 사육 일지 (Care Logs) 테이블 — 피딩 / 체중 / 메이팅 / 산란 / 탈피 / 청소 / 기타
- 인라인 기록 추가 폼 (LogForm)

**탭 3 — 관계도**

- @xyflow/react 인터랙티브 트리
- 부모(위) → 현재 개체(중간) → 자녀(아래) 3단 레이아웃
- 파란 엣지 = Sire, 핑크 엣지 = Dam, 초록 엣지 = 자녀
- 노드 클릭 시 해당 개체 페이지로 이동
- 다크/라이트 모드 자동 대응

### 사육 일지 기록 (LogForm)

- 기록 종류: 피딩 / 체중 측정 / 메이팅 / 산란 / 탈피 / 청소 / 기타
- 메이팅 기록: 파트너 목록 선택 또는 외부 이름 직접 입력, 성공/실패 여부
- 산란 기록: 알 개수, 유정란/무정란, 알 상태 메모
- 저장 후 상세 페이지 즉시 갱신 (router.refresh 없이 targeted re-fetch)

### 인큐베이터 페이지

- 진행 중인 모든 유정란 일람
- 예상 해칭일 D-day 카운트다운
- 해칭 진행률 프로그레스 바

### 글로벌 캐시 전략 (Zustand)

- 첫 로딩 후 게코 목록을 localStorage에 persist
- 앱 내 페이지 이동: 메모리 스토어 재사용 → API 호출 없음
- 새로고침 / 새 탭: localStorage 복원 → 즉시 렌더 후 stale 여부 확인
- 캐시 유효 시간: 3분 (STALE_MS)
- 등록 / 수정 / 삭제 / 로그아웃 시 캐시 강제 무효화

---

## Project Structure

```
app/
├── page.tsx                  # 홈 대시보드
├── geckos/
│   ├── new/page.tsx          # 개체 등록
│   └── [id]/
│       ├── page.tsx          # 개체 상세
│       └── edit/page.tsx     # 개체 수정
├── incubator/page.tsx        # 인큐베이터
├── components/
│   ├── GeckoDetailTabs.tsx   # 상세 탭 컨테이너
│   ├── LogForm.tsx           # 사육 일지 입력 폼
│   ├── WeightChart.tsx       # 체중 그래프
│   ├── EggTracker.tsx        # 산란 기록
│   ├── MatingTracker.tsx     # 메이팅 타임라인
│   ├── IncubationSection.tsx # 인큐베이팅 현황
│   ├── incubator-overview.tsx# 홈 인큐베이터 위젯
│   ├── LineageTree.tsx       # 관계도 (dynamic import wrapper)
│   ├── LineageTreeFlow.tsx   # React Flow 인터랙티브 트리
│   ├── MorphModal.tsx        # 모프 선택 모달
│   ├── LoginButton.tsx       # Google 로그인/로그아웃
│   ├── DeleteButton.tsx      # 개체 삭제
│   └── ui/                   # shadcn/ui 컴포넌트
├── stores/
│   └── geckoStore.ts         # Zustand 전역 캐시 스토어
└── types/
    └── gecko.ts              # Gecko 타입 정의
```
