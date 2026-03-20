"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Gecko } from "./types/gecko";
import { apiClient } from "@/lib/api";
import { useGeckoStore } from "./stores/geckoStore";
import { toast } from "sonner";
import LoginButton from "./components/LoginButton";
import { IncubatorOverview } from "./components/incubator-overview";
import { ThemeToggle } from "./components/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Skeleton } from "./components/ui/skeleton";
import {
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Search,
  Settings2,
  ShieldAlert,
  SlidersHorizontal,
  X,
} from "lucide-react";

const PAGE_SIZE = 12;

const FEED_TYPES = [
  { id: "충식", label: "🪲 충식" },
  { id: "슈퍼푸드", label: "🌿 슈퍼푸드" },
  { id: "직접입력", label: "✏️ 직접입력" },
];

const FEED_REMEMBER_KEY = "gecko_feed_remembered";

const DAYS = [
  { id: 0, label: "일" },
  { id: 1, label: "월" },
  { id: 2, label: "화" },
  { id: 3, label: "수" },
  { id: 4, label: "목" },
  { id: 5, label: "금" },
  { id: 6, label: "토" },
];

export default function Home() {
  const { data: session, status } = useSession();
  const [geckos, setGeckos] = useState<Gecko[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<"All" | "Male" | "Female">("All");
  const [currentPage, setCurrentPage] = useState(1);

  const {
    geckos: cachedGeckos,
    isStale,
    setGeckos: storeSetGeckos,
  } = useGeckoStore();

  // 피딩 스케줄 상태
  const [feedingDays, setFeedingDays] = useState<number[]>([]);
  const [isFeedingDay, setIsFeedingDay] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFedToday, setIsFedToday] = useState(false);

  // 퀵 액션 상태
  const [fedGeckoIds, setFedGeckoIds] = useState<Set<number>>(new Set());
  const [weightOpenId, setWeightOpenId] = useState<number | null>(null);
  const [weightValue, setWeightValue] = useState("");

  // 피딩 노트 패널 상태
  const [feedOpenId, setFeedOpenId] = useState<number | null>(null);
  const [feedChoices, setFeedChoices] = useState<string[]>([]);
  const [feedCustomText, setFeedCustomText] = useState("");
  const [feedRemember, setFeedRemember] = useState(false);
  const [feedSubmitting, setFeedSubmitting] = useState(false);

  // DB에서 설정 불러오기
  useEffect(() => {
    if (!session?.user?.djangoToken) return;

    const fetchSettings = async () => {
      try {
        if (!session.user.djangoToken) return;
        const res = await apiClient(session.user.djangoToken).get(
          "/api/settings/",
        );
        if (res.ok) {
          const data = await res.json();
          setFeedingDays(data.feeding_days || []);
        }
      } catch (error) {
        console.error("설정 로딩 실패", error);
      }
    };
    fetchSettings();
  }, [session]);

  // 요일 체크 로직
  useEffect(() => {
    const today = new Date().getDay();
    setIsFeedingDay(feedingDays.includes(today));
  }, [feedingDays]);

  // 피딩 완료 상태 계산 헬퍼
  const applyGeckos = (data: Gecko[]) => {
    setGeckos(data);
    const todayStr = new Date().toISOString().split("T")[0];
    const fedIds = new Set<number>();
    data.forEach((g) => {
      if (g.logs.find((l) => l.log_type === "Feeding" && l.log_date === todayStr))
        fedIds.add(g.id);
    });
    setFedGeckoIds(fedIds);
    setIsFedToday(data.length > 0 && fedIds.size > 0);
  };

  // 게코 데이터 불러오기 (스토어 캐시 우선)
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      setLoading(false);
      return;
    }
    if (!session?.user?.djangoToken) {
      setLoading(false);
      return;
    }

    // ─── 캐시 히트: 즉시 렌더 ────────────────────────────
    if (!isStale() && cachedGeckos.length > 0) {
      applyGeckos(cachedGeckos);
      setLoading(false);
      return;
    }

    // ─── 캐시 미스: API 호출 ─────────────────────────────
    const fetchGeckos = async () => {
      try {
        const res = await apiClient(session.user.djangoToken!).get("/api/geckos/");
        if (!res.ok) throw new Error("Failed to fetch");
        const data: Gecko[] = await res.json();
        applyGeckos(data);
        storeSetGeckos(data);
      } catch (error) {
        console.error("Failed to fetch geckos", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGeckos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status]);

  const toggleDay = async (dayId: number) => {
    if (!session?.user?.djangoToken) return;

    const newDays = feedingDays.includes(dayId)
      ? feedingDays.filter((d) => d !== dayId)
      : [...feedingDays, dayId];

    setFeedingDays(newDays);

    try {
      await apiClient(session.user.djangoToken).post("/api/settings/", {
        feeding_days: newDays,
      });
    } catch (error) {
      console.error("설정 저장 실패", error);
      toast.error("설정 저장에 실패했습니다.");
    }
  };

  const handleBulkFeeding = async () => {
    // 1. 토큰을 상수로 먼저 할당합니다.
    const token = session?.user?.djangoToken;

    // 2. 상수를 기준으로 검사합니다. 여기서 걸러지면 아래부터 token은 무조건 'string'입니다.
    if (!token) return;
    if (geckos.length === 0) return;
    if (!confirm(`총 ${geckos.length}마리에게 피딩 기록을 추가하시겠습니까?`))
      return;

    const todayStr = new Date().toISOString().split("T")[0];

    try {
      const promises = geckos.map((gecko) =>
        // 3. session.user.djangoToken 대신 확정된 token 변수를 사용합니다.
        apiClient(token).post("/api/logs/", {
          gecko: gecko.id,
          log_type: "Feeding",
          log_date: todayStr,
          note: "일괄 피딩 완료 ✅",
        }),
      );

      await Promise.all(promises);
      setIsFedToday(true);
      setFedGeckoIds(new Set(geckos.map((g) => g.id)));
      toast.success("모든 개체에게 피딩 기록이 추가되었습니다! 🦗");
    } catch (error) {
      console.error(error);
      toast.error("일부 요청이 실패했을 수 있습니다.");
    }
  };

  // 피딩 패널 열기
  const openFeedPanel = (geckoId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (fedGeckoIds.has(geckoId)) return;
    // 이미 열려있으면 닫기
    if (feedOpenId === geckoId) {
      setFeedOpenId(null);
      return;
    }
    // localStorage에서 기억된 선택 불러오기
    try {
      const saved = localStorage.getItem(FEED_REMEMBER_KEY);
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        setFeedChoices(parsed);
        setFeedRemember(true);  // 저장된 게 있으면 체크박스도 체크
      } else {
        setFeedChoices([]);
        setFeedRemember(false);
      }
    } catch {
      setFeedChoices([]);
      setFeedRemember(false);
    }
    setFeedCustomText("");
    setWeightOpenId(null);
    setFeedOpenId(geckoId);
  };

  // 피딩 기록 제출
  const handleSubmitFeed = async (geckoId: number, skip: boolean) => {
    if (!session?.user?.djangoToken) return;
    setFeedSubmitting(true);
    const todayStr = new Date().toISOString().split("T")[0];

    let note: string | undefined;
    if (!skip) {
      const parts: string[] = feedChoices.flatMap((c) => {
        if (c === "직접입력") return feedCustomText.trim() ? [feedCustomText.trim()] : [];
        return [c];
      });
      if (parts.length > 0) note = parts.join(", ");
    }

    // 기억하기 처리 (체크한 경우만 저장, 아니면 항상 클리어)
    if (!skip && feedRemember) {
      const toSave = feedChoices.filter((c) => c !== "직접입력");
      if (toSave.length > 0) localStorage.setItem(FEED_REMEMBER_KEY, JSON.stringify(toSave));
      else localStorage.removeItem(FEED_REMEMBER_KEY);
    } else {
      localStorage.removeItem(FEED_REMEMBER_KEY);
    }

    try {
      await apiClient(session.user.djangoToken).post("/api/logs/", {
        gecko: geckoId,
        log_type: "Feeding",
        log_date: todayStr,
        ...(note ? { note } : {}),
      });
      setFedGeckoIds((prev) => new Set([...prev, geckoId]));
      setIsFedToday(true);
      setFeedOpenId(null);
      toast.success(note ? `피딩 완료! 🦗 (${note})` : "피딩 완료! 🦗");
    } catch {
      toast.error("피딩 기록 실패");
    } finally {
      setFeedSubmitting(false);
    }
  };

  // 퀵 체중 저장
  const handleQuickWeight = async (geckoId: number, e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session?.user?.djangoToken || !weightValue) return;
    const todayStr = new Date().toISOString().split("T")[0];
    try {
      await apiClient(session.user.djangoToken).post("/api/logs/", {
        gecko: geckoId,
        log_type: "Weight",
        log_date: todayStr,
        weight: parseFloat(weightValue),
      });
      toast.success(`${weightValue}g 기록 완료! ⚖️`);
      setWeightOpenId(null);
      setWeightValue("");
    } catch {
      toast.error("체중 기록 실패");
    }
  };

  // 필터된 게코 목록
  const filteredGeckos = geckos.filter((g) => {
    const matchesSearch =
      searchQuery === "" ||
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.morph && g.morph.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesGender =
      genderFilter === "All" || g.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  // 페이지네이션
  const totalPages = Math.ceil(filteredGeckos.length / PAGE_SIZE);
  const pagedGeckos = filteredGeckos.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };
  const handleGenderChange = (val: "All" | "Male" | "Female") => {
    setGenderFilter(val);
    setCurrentPage(1);
  };

  // 렌더링 시작
  const eggCount = geckos
    .filter((g) => g.gender === "Female")
    .flatMap((g) =>
      g.logs.filter(
        (l) => l.log_type === "Laying" && !!l.expected_hatching_date,
      ),
    ).length;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <main className="container mx-auto p-4 md:p-8 pb-24 max-w-7xl">
        {status === "loading" || loading ? (
          /* 스켈레톤 로딩 UI */
          <div className="space-y-8 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-[200px] rounded-xl" />
              <Skeleton className="h-[200px] rounded-xl" />
              <Skeleton className="h-[200px] rounded-xl" />
            </div>
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-[300px] rounded-xl" />
              ))}
            </div>
          </div>
        ) : !session ? (
          /* 비로그인 상태 UI */
          <div className="flex flex-col items-center justify-center min-h-[65vh] text-center space-y-5">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-2 border border-primary/20">
              <ShieldAlert className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">
              나만의 게코 관리 매니저
            </h2>
            <p className="text-muted-foreground max-w-sm text-base leading-relaxed">
              크레스티드 게코들의 피딩, 메이팅, 해칭 일정을 한 곳에서 관리하세요.
            </p>
            <p className="text-sm text-muted-foreground/60 pt-2">
              우측 상단의 로그인 버튼을 눌러 시작하세요
            </p>
          </div>
        ) : (
          /* 로그인 완료 대시보드 UI */
          <div className="space-y-8 mt-2">

            {/* 인사 영역 */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  안녕하세요 👋
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                  오늘도 게코들이 잘 지내고 있나요?
                </p>
              </div>
              <Link href="/geckos/new">
                <Button variant="outline" size="sm" className="gap-1.5 border-primary/30 text-primary hover:bg-primary/5">
                  <Plus className="w-4 h-4" /> 새 가족 등록
                </Button>
              </Link>
            </div>

            {/* 핵심 현황 통계 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card rounded-xl border border-border/60 p-4 flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-xl flex-shrink-0">🦎</div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{geckos.length}</p>
                  <p className="text-xs text-muted-foreground font-medium">총 게코</p>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border/60 p-4 flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-xl flex-shrink-0">🥚</div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{eggCount}</p>
                  <p className="text-xs text-muted-foreground font-medium">부화 중인 알</p>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border/60 p-4 flex items-center gap-3 shadow-sm">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${isFedToday ? "bg-primary/10" : isFeedingDay ? "bg-orange-500/10" : "bg-muted/50"}`}>
                  {isFedToday ? "✅" : isFeedingDay ? "🔔" : "💤"}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground leading-tight">{isFedToday ? "완료" : isFeedingDay ? "필요" : "쉬는 날"}</p>
                  <p className="text-xs text-muted-foreground font-medium">오늘 피딩</p>
                </div>
              </div>
            </div>

            {/* 상단 대시보드 위젯 영역 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
              {/* 1. 피딩 스케줄러 위젯 */}
              <Card className="flex flex-col shadow-sm border-border/60 bg-card">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-primary" /> 피딩
                    스케줄
                  </CardTitle>
                  <Button
                    onClick={() => setShowSettings(!showSettings)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <Settings2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-center">
                  {showSettings ? (
                    <div className="flex gap-1.5 flex-wrap justify-center bg-muted/30 p-4 rounded-lg mb-2 border border-border/50">
                      {DAYS.map((day) => (
                        <Button
                          key={day.id}
                          onClick={() => toggleDay(day.id)}
                          className={`w-9 h-9 rounded-full text-sm font-bold transition-all ${
                            feedingDays.includes(day.id)
                              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md scale-105"
                              : "bg-muted text-foreground border border-border hover:bg-muted/80"
                          }`}
                          variant="outline"
                          size="icon"
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div
                      className={`flex flex-col items-center justify-center p-6 rounded-xl text-center border transition-all duration-300 h-full ${
                        isFedToday
                          ? "bg-primary/10 border-primary/20 text-primary"
                          : isFeedingDay
                            ? "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400"
                            : "bg-muted/30 border-border/50 text-muted-foreground"
                      }`}
                    >
                      {isFeedingDay ? (
                        isFedToday ? (
                          <>
                            <CheckCircle2 className="w-10 h-10 mb-2" />
                            <p className="font-bold text-lg">
                              오늘의 피딩 완료!
                            </p>
                            <p className="text-xs opacity-80 mt-1">
                              내일도 화이팅! 💪
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-bold text-lg mb-3 flex items-center gap-2 animate-pulse">
                              🔔 오늘은 피딩하는 날!
                            </p>
                            <Button
                              onClick={handleBulkFeeding}
                              className="w-full shadow-sm"
                            >
                              일괄 피딩 기록하기
                            </Button>
                          </>
                        )
                      ) : (
                        <>
                          <Clock className="w-8 h-8 mb-2 opacity-50" />
                          <p className="font-medium">오늘은 쉬는 날입니다</p>
                          <p className="text-xs opacity-70 mt-1">
                            {feedingDays.length > 0
                              ? `다음 예정일: ${feedingDays
                                  .sort()
                                  .map((d) => DAYS[d].label)
                                  .join(", ")}`
                              : "우측 상단 톱니바퀴를 눌러 요일을 설정하세요"}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 2. 인큐베이터 현황 */}
              <IncubatorOverview geckos={geckos} />

              {/* 3. 새 가족 등록 위젯 */}
              <Link href="/geckos/new" className="block h-full group">
                <Card className="h-full flex flex-col items-center justify-center border-dashed border-2 border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 cursor-pointer shadow-none bg-card/50">
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary/15 transition-all duration-200">
                      <Plus className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-base font-semibold mb-1 group-hover:text-primary transition-colors">
                      새 가족 등록
                    </CardTitle>
                    <CardDescription className="text-xs">
                      새로운 게코의 프로필을 추가하세요
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* 게코 목록 영역 */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">
                    내 게코 목록
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    총 {geckos.length}마리 등록됨
                    {filteredGeckos.length !== geckos.length && (
                      <span className="ml-1.5 text-primary font-medium">
                        ({filteredGeckos.length}마리 표시 중)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* 검색 + 필터 바 */}
              {geckos.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3 mb-5">
                  {/* 검색창 */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="이름 또는 모프로 검색..."
                      className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl border border-border/60 bg-muted/30 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => handleSearchChange("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* 성별 필터 */}
                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-muted-foreground shrink-0" />
                    {(["All", "Male", "Female"] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => handleGenderChange(g)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          genderFilter === g
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-border/50"
                        }`}
                      >
                        {g === "All" ? "전체" : g === "Male" ? "♂ 수컷" : "♀ 암컷"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {geckos.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 text-center border-2 border-dashed border-border/60 rounded-2xl bg-muted/10">
                  <span className="text-6xl mb-4 opacity-40">🦎</span>
                  <h3 className="text-base font-semibold text-foreground">
                    아직 등록된 게코가 없습니다
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    첫 번째 게코를 등록해보세요!
                  </p>
                  <Link href="/geckos/new">
                    <Button size="sm" className="gap-1.5">
                      <Plus className="w-4 h-4" /> 게코 등록하기
                    </Button>
                  </Link>
                </div>
              ) : filteredGeckos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center border border-dashed border-border/60 rounded-2xl bg-muted/10">
                  <Search className="w-9 h-9 mb-3 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-foreground">검색 결과가 없어요</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    다른 이름이나 모프로 검색해보세요
                  </p>
                  <button
                    onClick={() => { handleSearchChange(""); handleGenderChange("All"); }}
                    className="mt-3 text-xs text-primary hover:underline"
                  >
                    필터 초기화
                  </button>
                </div>
              ) : (
                <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {pagedGeckos.map((gecko) => (
                    <Link
                      href={`/geckos/${gecko.id}`}
                      key={gecko.id}
                      className="group"
                    >
                      <Card className="overflow-hidden border-border/60 hover:shadow-lg hover:border-primary/25 hover:-translate-y-0.5 transition-all duration-300 bg-card h-full flex flex-col">
                        <div className="relative aspect-[4/3] w-full bg-muted/60">
                          {gecko.profile_image ? (
                            <Image
                              src={gecko.profile_image}
                              alt={gecko.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              unoptimized
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-5xl opacity-20">
                              🦎
                            </div>
                          )}

                          {/* 성별 뱃지 */}
                          <div className="absolute top-2.5 right-2.5">
                            <Badge
                              variant={
                                gecko.gender === "Male"
                                  ? "default"
                                  : gecko.gender === "Female"
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="shadow-sm font-semibold backdrop-blur-md text-xs"
                            >
                              {gecko.gender === "Male"
                                ? "♂ 수컷"
                                : gecko.gender === "Female"
                                  ? "♀ 암컷"
                                  : "미구분"}
                            </Badge>
                          </div>

                          {/* 배란 여부 인디케이터 */}
                          {gecko.is_ovulating && gecko.gender === "Female" && (
                            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 bg-background/90 backdrop-blur-sm px-2.5 py-1 rounded-full border border-border shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                              <span className="text-xs font-semibold text-foreground">
                                배란중
                              </span>
                            </div>
                          )}
                        </div>

                        <CardContent className="p-4 flex-1 flex flex-col gap-2">
                          <div>
                            <h3 className="text-base font-bold truncate group-hover:text-primary transition-colors">
                              {gecko.name}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate font-medium">
                              {gecko.morph || "모프 정보 없음"}
                            </p>
                          </div>
                          <div className="mt-auto grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
                            <div className="bg-muted/50 rounded-md px-2 py-1.5 text-center">
                              <span className="block font-medium text-foreground/70">{gecko.birth_date || "미상"}</span>
                              <span className="text-[10px]">생년월일</span>
                            </div>
                            <div className="bg-muted/50 rounded-md px-2 py-1.5 text-center">
                              <span className="block font-medium text-foreground/70">{gecko.weight ? `${gecko.weight}g` : "미상"}</span>
                              <span className="text-[10px]">몸무게</span>
                            </div>
                          </div>

                          {/* 퀵 액션 바 */}
                          <div
                            className="flex gap-1.5 pt-2 border-t border-border/40"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          >
                            <button
                              onClick={(e) => openFeedPanel(gecko.id, e)}
                              disabled={fedGeckoIds.has(gecko.id)}
                              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                fedGeckoIds.has(gecko.id)
                                  ? "bg-green-500/10 text-green-600 dark:text-green-400 cursor-default"
                                  : feedOpenId === gecko.id
                                    ? "bg-green-500/15 text-green-600 dark:text-green-400"
                                    : "bg-muted/50 text-muted-foreground hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400"
                              }`}
                            >
                              {fedGeckoIds.has(gecko.id)
                                ? <><CheckCircle2 className="w-3 h-3" /> 피딩완료</>
                                : <>🦗 피딩</>}
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setWeightOpenId(weightOpenId === gecko.id ? null : gecko.id);
                                setFeedOpenId(null);
                                setWeightValue("");
                              }}
                              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                weightOpenId === gecko.id
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                  : "bg-muted/50 text-muted-foreground hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400"
                              }`}
                            >
                              ⚖️ 체중
                            </button>
                          </div>

                          {/* 피딩 노트 패널 */}
                          {feedOpenId === gecko.id && (
                            <div
                              className="flex flex-col gap-2 p-2.5 rounded-xl bg-green-500/5 border border-green-500/20"
                              onClick={(e) => { e.stopPropagation(); }}
                            >
                              {/* 먹이 종류 칩 */}
                              <div className="flex gap-1.5 flex-wrap">
                                {FEED_TYPES.map((ft) => (
                                  <button
                                    key={ft.id}
                                    type="button"
                                    onClick={() => {
                                      setFeedChoices((prev) =>
                                        prev.includes(ft.id)
                                          ? prev.filter((c) => c !== ft.id)
                                          : [...prev, ft.id]
                                      );
                                    }}
                                    className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all border ${
                                      feedChoices.includes(ft.id)
                                        ? "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/40"
                                        : "bg-background text-muted-foreground border-border/60 hover:border-green-500/40 hover:text-green-600"
                                    }`}
                                  >
                                    {ft.label}
                                  </button>
                                ))}
                              </div>

                              {/* 직접입력 텍스트 */}
                              {feedChoices.includes("직접입력") && (
                                <input
                                  type="text"
                                  value={feedCustomText}
                                  onChange={(e) => setFeedCustomText(e.target.value)}
                                  placeholder="먹이 내용 입력..."
                                  autoFocus
                                  className="px-2.5 py-1.5 text-xs rounded-lg border border-border/60 bg-background focus:outline-none focus:ring-1 focus:ring-green-500/40"
                                  onKeyDown={(e) => {
                                    e.stopPropagation();
                                    if (e.key === "Enter") handleSubmitFeed(gecko.id, false);
                                    if (e.key === "Escape") setFeedOpenId(null);
                                  }}
                                />
                              )}

                              {/* 기억하기 */}
                              <label
                                className="flex items-center gap-1.5 cursor-pointer w-fit"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  checked={feedRemember}
                                  onChange={(e) => setFeedRemember(e.target.checked)}
                                  className="w-3 h-3 rounded accent-green-600"
                                />
                                <span className="text-[11px] text-muted-foreground">다음에도 기억하기</span>
                              </label>

                              {/* 액션 버튼 */}
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleSubmitFeed(gecko.id, true)}
                                  disabled={feedSubmitting}
                                  className="flex-1 py-1.5 text-[11px] font-semibold rounded-lg border border-border/60 bg-background text-muted-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
                                >
                                  건너뛰기
                                </button>
                                <button
                                  onClick={() => handleSubmitFeed(gecko.id, false)}
                                  disabled={feedSubmitting}
                                  className="flex-1 py-1.5 text-[11px] font-semibold rounded-lg bg-green-600 text-white hover:bg-green-500 transition-colors disabled:opacity-50"
                                >
                                  {feedSubmitting ? "저장중..." : "완료 🦗"}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* 체중 입력 폼 */}
                          {weightOpenId === gecko.id && (
                            <div
                              className="flex gap-1.5"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            >
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={weightValue}
                                onChange={(e) => setWeightValue(e.target.value)}
                                placeholder="g 입력"
                                autoFocus
                                className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-border/60 bg-background focus:outline-none focus:ring-1 focus:ring-primary/40"
                                onKeyDown={(e) => {
                                  e.stopPropagation();
                                  if (e.key === "Enter") handleQuickWeight(gecko.id, e);
                                  if (e.key === "Escape") { setWeightOpenId(null); setWeightValue(""); }
                                }}
                              />
                              <button
                                onClick={(e) => handleQuickWeight(gecko.id, e)}
                                className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                              >
                                저장
                              </button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-border/60 bg-card hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) =>
                        p === 1 ||
                        p === totalPages ||
                        Math.abs(p - currentPage) <= 1,
                      )
                      .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                        if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((item, idx) =>
                        item === "..." ? (
                          <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-muted-foreground text-sm">
                            ···
                          </span>
                        ) : (
                          <button
                            key={item}
                            onClick={() => setCurrentPage(item as number)}
                            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                              currentPage === item
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "border border-border/60 bg-card hover:bg-muted text-foreground"
                            }`}
                          >
                            {item}
                          </button>
                        ),
                      )}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-border/60 bg-card hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
