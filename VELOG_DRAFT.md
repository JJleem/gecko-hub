# [개인 프로젝트] GeckoHub — 레오파드 게코 개체 관리 웹 서비스 개발기

> 태그: `Next.js`, `Django`, `Zustand`, `React Flow`, `개인프로젝트`, `풀스택`

---

## 왜 만들었나

레오파드 게코를 키우면서 개체 관리를 엑셀로 하고 있었다. 피딩 날짜, 체중, 메이팅 기록, 산란 날짜, 부화 예정일... 개체 수가 늘어날수록 스프레드시트가 감당이 안 됐다. 파충류 특화 관리 앱은 국내에 없었고, 해외 앱도 UI가 구리거나 기능이 너무 단순했다. 그래서 직접 만들기로 했다.

---

## 스택 선택

**프론트엔드: Next.js + TypeScript**

App Router를 써보고 싶기도 했고, Vercel 배포가 편하다는 것도 이유였다. 상태관리는 처음엔 아무것도 안 쓰다가 페이지마다 API를 다시 불러오는 게 너무 느려서 Zustand를 도입했다.

**백엔드: Django REST Framework**

Python에 익숙하고, DRF가 CRUD API 만들기에 빠르다. 데이터베이스는 Supabase(PostgreSQL)를 붙였다. 둘 다 Vercel에 배포했는데, cold start 때문에 첫 응답이 느린 게 단점이다.

---

## 구현한 기능들

### 개체 관리 (CRUD)
기본 중의 기본이지만 신경 쓴 부분이 있다. 모프(Morph) 선택 모달을 따로 만들었는데, 레오파드 게코의 유전자 체계가 생각보다 복잡하다. Tremper, Bell, Rainwater, Mack Snow 같은 알비노 계열 분류와 조합이 있어서 그냥 텍스트 입력으로 두면 데이터가 제각각이 된다. 모달로 체계화했다.

프로필 이미지는 Supabase Storage에 업로드하고 URL을 DB에 저장하는 방식이다.

### 사육 일지 (Care Logs)
피딩, 체중 측정, 메이팅, 산란, 탈피, 청소, 기타 7가지 타입을 지원한다.

메이팅 기록이 좀 특이한데, 같은 컬렉션 내 개체를 파트너로 연결하거나 외부 개체 이름을 직접 입력할 수 있다. 연결된 경우 양쪽 개체의 기록 탭에 상호 참조로 보인다. 이 양방향 참조를 백엔드에서 처리하는 게 처음에 좀 까다로웠다. `mating_logs`라는 역참조 관계를 따로 시리얼라이저에 추가해서 해결했다.

산란 기록은 유정란/무정란 여부, 알 개수, 알 상태를 기록하고, 유정란이면 자동으로 예상 부화일을 계산해서 인큐베이팅 트래커에 반영한다.

### 체중 그래프
Recharts로 구현한 꺾은선 그래프. Weight 타입 로그만 필터링해서 날짜순으로 표시한다.

### 인터랙티브 혈통 관계도
이게 이번 프로젝트에서 가장 재미있었던 부분이다.

처음엔 그냥 텍스트로 Sire/Dam을 보여줬는데, 혈통이 복잡해질수록 시각화가 필요했다. `@xyflow/react` (React Flow)를 도입했다.

구조는 3단계다:
- 위: 부모 (Sire는 파란색, Dam은 핑크색)
- 중간: 현재 개체
- 아래: 이 개체의 자녀들 (초록색 엣지)

양방향 관계가 핵심 과제였다. 기존에는 부모 → 자녀 방향만 저장돼 있었고, 부모의 상세 페이지에서는 자녀 목록이 안 보였다. 백엔드에서 `sire_children`, `dam_children` 역참조를 prefetch하고 `children` 필드를 시리얼라이저에 추가해서 해결했다.

React Flow 특성상 SSR이 안 된다. `next/dynamic`으로 `ssr: false`를 써서 클라이언트에서만 로드하고, 로딩 중엔 Skeleton을 보여준다.

다크모드 대응도 필요했는데, `next-themes`의 `useTheme`에서 `resolvedTheme`을 가져와 React Flow의 `colorMode` prop에 넘겨줬다.

### 글로벌 캐시 (Zustand)
개발하다 보니 페이지 이동할 때마다 API를 다시 부르는 게 체감상 너무 느렸다. Vercel + Supabase 조합의 cold start 문제가 크다.

Zustand로 게코 목록을 전역으로 들고 다니게 했다. 포인트는 두 가지다:

**1. 3분 stale-while-revalidate**
```typescript
const STALE_MS = 3 * 60 * 1000;

isStale: () => {
  const { lastFetched } = get();
  if (!lastFetched) return true;
  return Date.now() - lastFetched > STALE_MS;
}
```
캐시가 살아있으면 즉시 렌더하고, stale하면 백그라운드에서 revalidation.

**2. localStorage persist**
```typescript
import { persist } from "zustand/middleware";

export const useGeckoStore = create<GeckoStore>()(
  persist(
    (set, get) => ({ ... }),
    { name: "gecko-store" }
  )
);
```
앱 내 클라이언트 라우팅은 메모리 스토어가 그대로 살아있어서 재조회가 없다. F5 새로고침이나 새 탭으로 열어도 localStorage에서 복원해서 즉시 렌더된다.

등록/수정/삭제/로그아웃 시에는 `clear()`를 호출해서 캐시를 강제 무효화한다.

### N+1 쿼리 문제
처음 배포하고 홈 로딩이 비정상적으로 느렸다. Django Debug Toolbar로 찍어보니 게코 10개 조회에 쿼리가 50개 이상 나가고 있었다.

`GeckoSerializer`에서 `get_logs()` 메서드가 매 게코마다 DB를 치고 있었던 것. `select_related` + `prefetch_related`로 해결했다.

```python
def _gecko_queryset_with_prefetch():
    log_qs = CareLog.objects.select_related('partner', 'gecko')
    child_qs = Gecko.objects.only('id', 'name', 'profile_image', 'morph', 'gender')
    return Gecko.objects.select_related('sire', 'dam').prefetch_related(
        Prefetch('logs', queryset=log_qs),
        Prefetch('mating_logs', queryset=log_qs),
        Prefetch('sire_children', queryset=child_qs),
        Prefetch('dam_children', queryset=child_qs),
    )
```

---

## 개발하면서 막힌 것들

### DRF router `basename` 오류
`ViewSet`에 `queryset` 속성 없이 `get_queryset()`만 정의하면 DRF 라우터가 basename을 자동으로 추론하지 못한다. `AssertionError: basename argument not specified` 에러가 난다.

```python
# 이렇게 하면 된다
router.register(r'logs', CareLogViewSet, basename='carelog')
```

### Next.js App Router SSR 함정
서버 컴포넌트에서 `cookies()`나 `next/headers`를 쓰다가 클라이언트 컴포넌트로 전환하는 과정에서 꽤 헤맸다. App Router에서 인증 토큰이 필요한 API 호출은 전부 클라이언트에서 하게 됐다.

### WSL에서 git push
Windows 경로를 WSL에서 git 레포로 쓸 때 `.git/config.lock`에 `chmod` 에러가 계속 났다. 실제 push는 성공하는데 에러 메시지가 같이 나와서 처음엔 실패한 줄 알았다. WSL과 Windows 파일시스템 권한 차이 때문인데, 무시해도 된다.

---

## 아쉬운 점 / 앞으로 할 것

- 모바일 최적화가 부족하다. 반응형은 되는데 터치 UX를 더 다듬어야 한다.
- 인큐베이터 온도/습도 기록 기능이 없다. 추가할 예정이다.
- 게코 공유 기능 (다른 사람이 내 게코 프로필을 볼 수 있는 링크)
- 피딩 알림 푸시 기능

---

## 마무리

처음엔 개인 도구로 만들려고 시작했는데, 만들다 보니 꽤 완성도 있는 서비스가 됐다. 파충류 키우는 사람들한테 실제로 쓸 수 있는 서비스를 만들었다는 게 뿌듯하다.

코드는 GitHub에 올려뒀다.

**GitHub →** https://github.com/JJleem/gecko-hub
**Live →** https://geckohub.vercel.app
