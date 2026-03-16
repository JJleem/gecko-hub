# GeckoHub 개발기 2편 — "기능은 됐고, 이제 제대로 만들자"

> Claude와 함께한 리팩토링 & 고도화 여정

---

## 🔙 지난 이야기

1편에서 Gemini를 백엔드 사수로 채용해 GeckoHub MVP를 3시간 컷으로 완성했다.
로그인, 개체 CRUD, 피딩 스케줄러, 인큐베이터 로직 — 핵심 기능은 모두 돌아갔다.

그런데 막상 배포해놓고 매일 쓰다 보니 불만이 쌓이기 시작했다.

> "페이지 이동할 때마다 로딩이 너무 길다."
> "UI가... 좀 투박하다. 프론트엔드 개발자라는 자존심이 허락하지 않는다."
> "혈통 관계도가 텍스트로만 나오는데, 실제로 트리로 보고 싶다."

1편 마지막에 "다음엔 디자인을 입히러 가야겠다"고 했는데, 결국 디자인만이 아니라 **구조부터 다시 뜯게 됐다.** 이번엔 Claude를 파트너로 잡고 고도화를 시작했다.

---

## 🤖 왜 Claude로 갈아탔나?

Gemini로 빠르게 MVP를 찍는 건 좋았는데, 리팩토링이나 코드 품질 개선처럼 "기존 코드를 이해하고 개선하는" 작업에서는 컨텍스트를 잃어버리는 경우가 많았다. Claude는 대화 맥락을 더 잘 유지하면서, "이 코드가 왜 느린지"부터 "어떻게 고치면 되는지"까지 흐름이 끊기지 않고 이어지는 느낌이었다.

---

## 🐢 첫 번째 문제: 느린 로딩

배포하고 나서 가장 먼저 체감한 문제였다.

홈 → 개체 상세 → 다시 홈으로 돌아오면, **매번 로딩 스피너가 돌았다.** Vercel + Supabase 조합의 cold start 특성상 첫 응답이 특히 느렸다.

원인을 파고들어 보니 두 가지였다.

### 원인 1: N+1 쿼리

Django 백엔드가 홈 화면에서 게코 목록을 불러올 때, 게코 10마리면 쿼리가 50개 이상 나가고 있었다.

`GeckoSerializer`의 `get_logs()` 메서드가 매 게코마다 DB를 개별로 조회하고 있었던 것이다. 전형적인 N+1 문제.

`select_related` + `prefetch_related`로 한 방에 해결했다.

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

쿼리 수가 극적으로 줄었다.

### 원인 2: 페이지마다 API를 새로 부른다

홈에서 개체 목록을 불러오고, 상세 페이지 갔다가 다시 홈에 오면 또 API를 부른다. 같은 데이터를 계속 새로 받아오는 셈이다.

Claude에게 물었더니 Zustand로 전역 캐시를 두는 방식을 제안했다.

**핵심 아이디어는 간단하다:**
- 처음 불러온 게코 목록을 전역 스토어에 저장한다
- 3분 이내면 API 안 부르고 스토어에서 꺼낸다 (stale-while-revalidate)
- F5 새로고침이나 새 탭에서도 즉시 렌더되도록 localStorage에 persist한다

```typescript
// 3분 지나야 stale 처리
const STALE_MS = 3 * 60 * 1000;

isStale: () => {
  const { lastFetched } = get();
  if (!lastFetched) return true;
  return Date.now() - lastFetched > STALE_MS;
}
```

```typescript
// localStorage 영속화
export const useGeckoStore = create<GeckoStore>()(
  persist(
    (set, get) => ({ ... }),
    { name: "gecko-store" }
  )
);
```

이렇게 하면 페이지를 돌아다녀도, 새로고침을 해도, 새 탭으로 열어도 — 캐시 유효 시간 내엔 API 없이 즉시 렌더된다.

물론 등록/수정/삭제/로그아웃 시엔 `clear()`를 호출해서 캐시를 강제로 날린다. 오래된 데이터를 보여주면 안 되니까.

---

## 🎨 두 번째 문제: 투박한 UI

MVP는 기능 중심으로 빠르게 짰다 보니, 솔직히 디자인이 많이 아쉬웠다. 프론트엔드 개발자 자존심 문제였다.

shadcn/ui를 전면 도입해서 컴포넌트 체계를 잡고, TailwindCSS v4로 올리면서 다크모드를 제대로 구현했다.

**달라진 것들:**
- 홈 대시보드: 카드 그리드 + 상단 요약 통계 바 (총 게코 수 / 부화 중 알 / 오늘 피딩)
- 인큐베이터 위젯: D-day 프로그레스 바로 시각화
- 개체 상세 페이지: 탭 구조로 개편 (개요 / 성장 기록 / 관계도)

특히 개체 상세 페이지는 기존에 스크롤로 쭉 내려가는 긴 페이지였는데, 탭으로 나누니까 훨씬 깔끔해졌다.

---

## 🌳 세 번째 문제: 혈통 관계도가 텍스트다

원래 혈통 관계는 그냥 "Sire: OOO / Dam: OOO" 텍스트 카드로 보여줬다. 개체가 많아지니까 이게 한계였다. 실제 트리 형태로 시각화하고 싶었다.

Claude한테 얘기했더니 `@xyflow/react` (React Flow)를 제안했다.

**구조는 3단계:**

```
[Sire] ──────── [Dam]
    \              /
        [현재 개체]
        /    |    \
  [자녀1] [자녀2] [자녀3]
```

- 파란 엣지 = Sire 관계
- 핑크 엣지 = Dam 관계
- 초록 엣지 = 자녀 관계
- 노드 클릭 시 해당 개체 페이지로 이동

근데 여기서 문제가 생겼다.

### 양방향 관계 버그

기존 데이터 구조는 **부모 → 자녀** 방향만 저장하고 있었다. 즉, 부모 개체의 상세 페이지에서 자녀 목록이 안 보이는 것이다. 트리를 그리려면 반대 방향도 있어야 했다.

백엔드에서 역참조를 prefetch하고 `children` 필드를 시리얼라이저에 추가해서 해결했다.

```python
def get_children(self, obj):
    from_sire = list(obj.sire_children.all())
    from_dam = list(obj.dam_children.all())
    seen = set()
    unique = []
    for c in from_sire + from_dam:
        if c.id not in seen:
            seen.add(c.id)
            unique.append(c)
    return ParentGeckoSerializer(unique, many=True).data
```

이제 부모 페이지에서도 자녀가 보이고, 자녀 페이지에서도 부모가 보인다.

### SSR 문제

React Flow는 브라우저 API를 쓰기 때문에 Next.js SSR 환경에서 그냥 import하면 에러가 난다.

`next/dynamic`으로 `ssr: false`를 써서 클라이언트에서만 로드하고, 로딩 중엔 Skeleton을 보여주는 방식으로 처리했다.

```typescript
const LineageTreeFlow = dynamic(() => import("./LineageTreeFlow"), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[520px] rounded-xl" />,
});
```

---

## 🔧 그 외 자잘한 트러블슈팅

### DRF `basename` 오류

배포하고 나서 갑자기 서버가 안 뜨는 상황이 생겼다.

```
AssertionError: basename argument not specified
```

DRF 라우터는 `ViewSet`에 `queryset`이 없으면 basename을 자동으로 추론하지 못한다. `get_queryset()`만 정의한 `CareLogViewSet`이 문제였다.

```python
# 해결: basename 명시
router.register(r'logs', CareLogViewSet, basename='carelog')
```

### 배포 후 데이터 없음

배포하고 나서 화면이 빈 채로 나왔다. 한참 삽질하다가 원인을 찾았는데...

백엔드 Vercel 환경변수에 `SECRET_KEY`가 빠져 있었다. 환경변수 추가하니까 바로 됐다. 이런 게 제일 허탈하다.

---

## 💭 마치며

1편에서 "백엔드 진입장벽을 부수는 망치"라고 했는데, 2편을 쓰면서 느낌이 조금 달라졌다.

Gemini랑 MVP를 찍을 땐 "AI가 만들어준다"는 느낌이 강했다면, Claude랑 리팩토링을 하면서는 "AI랑 같이 생각한다"는 느낌이 더 강했다. 코드가 왜 느린지, 어떻게 구조를 잡으면 좋은지 — 그냥 코드를 뱉어주는 게 아니라 이유를 설명하면서 같이 고민해주는 느낌?

뭐가 됐든, MVP 이후 "이게 뭔가 좀 부족한데"에서 "이 정도면 써도 되겠다"로 바뀐 건 맞다.

아직 하고 싶은 것들이 남아 있다:
- 인큐베이터 온도/습도 기록
- 개체 프로필 공유 링크
- 피딩 푸시 알림

천천히 만들어 나갈 예정이다.

**GitHub →** https://github.com/JJleem/gecko-hub
**Live →** https://geckohub.vercel.app
