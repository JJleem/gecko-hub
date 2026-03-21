"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Gecko } from "./types/gecko";
import { apiClient } from "@/lib/api";
import { useGeckoStore } from "./stores/geckoStore";
import { toast } from "sonner";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Skeleton } from "./components/ui/skeleton";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Settings2,
  X,
} from "lucide-react";

const PAGE_SIZE = 12;

const FEED_TYPES = [
  { id: "충식", label: "🪲 충식" },
  { id: "슈퍼푸드", label: "🌿 슈퍼푸드" },
  { id: "직접입력", label: "✏️ 직접입력" },
];

const FEED_REMEMBER_KEY = "gecko_feed_remembered";

// 월~일 순서 (이번 주 스트립용)
const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

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

  // 통계
  const maleCount = geckos.filter((g) => g.gender === "Male").length;
  const femaleCount = geckos.filter((g) => g.gender === "Female").length;
  const ovulatingCount = geckos.filter((g) => g.is_ovulating).length;
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthlyFeedings = geckos
    .flatMap((g) => g.logs)
    .filter((l) => l.log_type === "Feeding" && l.log_date.startsWith(thisMonth)).length;

  const todayStr = new Date().toISOString().split("T")[0];

  // 이번 주 날짜 배열 (월~일)
  const weekDates = (() => {
    const today = new Date();
    const day = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  })();

  const formatKorDate = (date: Date) => {
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const weekNames = ["일", "월", "화", "수", "목", "금", "토"];
    return `${m}월 ${d}일 ${weekNames[date.getDay()]}요일`;
  };

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
          <div className="flex flex-col items-center justify-center min-h-[65vh] text-center gap-5">
            <div className="text-8xl mb-2 drop-shadow-sm">🦎</div>
            <div className="space-y-3">
              <h2 className="text-3xl font-extrabold tracking-tight">
                나만의 게코 관리 매니저
              </h2>
              <p className="text-muted-foreground max-w-sm text-base leading-relaxed">
                크레스티드 게코들의 피딩, 메이팅, 해칭 일정을<br />한 곳에서 따뜻하게 관리하세요.
              </p>
            </div>
            <p className="text-sm text-muted-foreground/50">
              우측 상단의 로그인 버튼을 눌러 시작하세요
            </p>
          </div>
        ) : (
          /* 로그인 완료 UI */
          <div className="space-y-5 mt-2">

            {/* ── 1. TODAY CARD ── */}
            <div className="relative overflow-hidden rounded-3xl border border-border/30 bg-gradient-to-br from-primary/5 via-card to-accent/8 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                    {formatKorDate(new Date())}
                  </p>
                  <h1 className="text-xl sm:text-2xl font-extrabold mt-1.5 text-foreground leading-snug">
                    {isFeedingDay && !isFedToday
                      ? "오늘은 피딩하는 날이에요 🦗"
                      : isFedToday
                        ? "오늘 피딩 완료했어요 ✅"
                        : "오늘은 쉬는 날이에요 💤"}
                  </h1>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-card border border-border/50 rounded-full px-3 py-1.5 shadow-sm">
                      🦎 {geckos.length}마리
                    </span>
                    {eggCount > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-50 dark:bg-amber-900/25 border border-amber-200/60 dark:border-amber-700/30 text-amber-700 dark:text-amber-400 rounded-full px-3 py-1.5 shadow-sm">
                        🥚 {eggCount}알 부화 중
                      </span>
                    )}
                    {isFedToday ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/25 border border-emerald-200/60 dark:border-emerald-700/30 text-emerald-700 dark:text-emerald-400 rounded-full px-3 py-1.5 shadow-sm">
                        ✅ 피딩 완료
                      </span>
                    ) : isFeedingDay ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-orange-50 dark:bg-orange-900/25 border border-orange-200/60 dark:border-orange-700/30 text-orange-700 dark:text-orange-400 rounded-full px-3 py-1.5 shadow-sm">
                        🔔 피딩 예정
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {isFeedingDay && !isFedToday && (
                    <Button
                      onClick={handleBulkFeeding}
                      size="sm"
                      className="rounded-full px-4 font-bold shadow-sm gap-1.5 whitespace-nowrap text-xs"
                    >
                      🦗 일괄 피딩
                    </Button>
                  )}
                  <Link href="/geckos/new">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full px-4 font-bold w-full gap-1.5 border-primary/30 text-primary hover:bg-primary/5 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> 새 가족
                    </Button>
                  </Link>
                </div>
              </div>
              {/* 배경 데코 */}
              <div className="absolute -right-6 -bottom-6 text-[100px] opacity-[0.035] pointer-events-none select-none leading-none">🦎</div>
            </div>

            {/* ── 2. WEEK CALENDAR STRIP ── */}
            <div className="bg-card rounded-2xl border border-border/40">
              <div className="flex items-center justify-between px-4 pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-extrabold text-foreground">이번 주</h2>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors ${showSettings ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"}`}
                    title="피딩 요일 설정"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <Link href="/calendar" className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors">
                  전체 보기 →
                </Link>
              </div>

              {/* 요일 설정 패널 */}
              {showSettings && (
                <div className="flex gap-2 flex-wrap justify-center px-4 pb-3 pt-0 border-t border-border/30 pt-3">
                  <p className="w-full text-center text-xs text-muted-foreground mb-1">피딩하는 요일을 선택하세요</p>
                  {DAYS.map((day) => (
                    <button
                      key={day.id}
                      onClick={() => toggleDay(day.id)}
                      className={`w-9 h-9 rounded-full text-sm font-bold transition-all ${
                        feedingDays.includes(day.id)
                          ? "bg-primary text-primary-foreground shadow-sm scale-105"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted border border-border/50"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              )}

              {/* 7일 캘린더 */}
              <div className="grid grid-cols-7 px-2 pb-3">
                {weekDates.map((date, idx) => {
                  const dayOfWeek = date.getDay();
                  const dateStr = date.toISOString().split("T")[0];
                  const isToday = dateStr === todayStr;
                  const isFeedDay = feedingDays.includes(dayOfWeek);
                  const dayLogs = geckos.flatMap((g) => g.logs.filter((l) => l.log_date === dateStr));
                  const hasFeedLog = dayLogs.some((l) => l.log_type === "Feeding");
                  const hasLayingLog = dayLogs.some((l) => l.log_type === "Laying");
                  const isPast = dateStr < todayStr;

                  return (
                    <div
                      key={dateStr}
                      className={`flex flex-col items-center gap-0.5 py-2 px-0.5 rounded-2xl ${isToday ? "bg-primary/8 dark:bg-primary/15" : ""}`}
                    >
                      <span className={`text-[11px] font-bold ${
                        dayOfWeek === 0 ? "text-rose-500" : dayOfWeek === 6 ? "text-sky-500" : "text-muted-foreground"
                      }`}>
                        {DAY_LABELS[idx]}
                      </span>
                      <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
                        isToday
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-foreground"
                      }`}>
                        {date.getDate()}
                      </span>
                      <div className="h-4 flex items-center justify-center gap-0.5">
                        {hasFeedLog ? (
                          <span className="text-[12px] leading-none">🦗</span>
                        ) : isFeedDay && !isPast ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                        ) : isFeedDay && isPast ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/25" />
                        ) : null}
                        {hasLayingLog && <span className="text-[10px] leading-none">🥚</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── 3. STATS ── */}
            {geckos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { emoji: "🦎", label: "전체", value: geckos.length, unit: "마리", color: "bg-card border-border/40" },
                  { emoji: "♂", label: "수컷", value: maleCount, unit: "마리", color: "bg-sky-50 dark:bg-sky-950/30 border-sky-200/50 dark:border-sky-800/30" },
                  { emoji: "♀", label: "암컷", value: femaleCount, unit: "마리", color: "bg-rose-50 dark:bg-rose-950/30 border-rose-200/50 dark:border-rose-800/30" },
                  { emoji: "🥚", label: "배란중", value: ovulatingCount, unit: "마리", color: "bg-amber-50 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-800/30" },
                  { emoji: "🦗", label: "이번달 피딩", value: monthlyFeedings, unit: "회", color: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-800/30" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 ${stat.color}`}
                  >
                    <span className="text-2xl leading-none">{stat.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-muted-foreground leading-none mb-1">{stat.label}</p>
                      <p className="text-lg font-black text-foreground leading-none">
                        {stat.value}<span className="text-xs font-bold text-muted-foreground ml-0.5">{stat.unit}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── 4. GECKO LIST ── */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-foreground">내 게코들</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {geckos.length}마리 등록됨
                    {filteredGeckos.length !== geckos.length && (
                      <span className="ml-1.5 text-primary font-semibold">({filteredGeckos.length}마리 표시 중)</span>
                    )}
                  </p>
                </div>
              </div>

              {/* 검색 + 필터 */}
              {geckos.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
                  <div className="relative flex-1">
                    <label htmlFor="gecko-search" className="sr-only">게코 이름 또는 모프로 검색</label>
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
                    <input
                      id="gecko-search"
                      type="search"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="이름 또는 모프로 검색..."
                      className="w-full pl-10 pr-8 py-2.5 text-sm rounded-full border border-border/50 bg-card placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition-all"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => handleSearchChange("")}
                        aria-label="검색어 지우기"
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <div
                    role="group"
                    aria-label="성별 필터"
                    className="flex items-center gap-1 bg-muted/40 rounded-full px-1.5 py-1 border border-border/40"
                  >
                    {(["All", "Male", "Female"] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => handleGenderChange(g)}
                        aria-pressed={genderFilter === g}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                          genderFilter === g ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {g === "All" ? "전체" : g === "Male" ? "♂ 수컷" : "♀ 암컷"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {geckos.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 text-center rounded-3xl bg-muted/20 border-2 border-dashed border-border/40">
                  <span className="text-6xl mb-4">🦎</span>
                  <h3 className="text-base font-bold text-foreground">아직 등록된 게코가 없어요</h3>
                  <p className="text-sm text-muted-foreground mt-1.5 mb-5">첫 번째 게코를 등록해보세요!</p>
                  <Link href="/geckos/new">
                    <Button size="sm" className="gap-1.5 rounded-full px-5 font-semibold shadow-sm">
                      <Plus className="w-4 h-4" /> 게코 등록하기
                    </Button>
                  </Link>
                </div>
              ) : filteredGeckos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center rounded-3xl bg-muted/20 border-2 border-dashed border-border/40">
                  <span className="text-5xl mb-3">🔍</span>
                  <p className="text-sm font-bold text-foreground">검색 결과가 없어요</p>
                  <p className="text-xs text-muted-foreground mt-1.5">다른 이름이나 모프로 검색해보세요</p>
                  <button
                    onClick={() => { handleSearchChange(""); handleGenderChange("All"); }}
                    className="mt-4 text-xs font-semibold text-primary hover:underline"
                  >
                    필터 초기화
                  </button>
                </div>
              ) : (
                <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {pagedGeckos.map((gecko) => (
                    <Link
                      href={`/geckos/${gecko.id}`}
                      key={gecko.id}
                      className="group"
                    >
                      <Card className="overflow-hidden border border-border/30 hover:border-primary/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.25)] transition-all duration-300 bg-card h-full flex flex-col rounded-2xl">
                        {/* 사진 */}
                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/30">
                          {gecko.profile_image ? (
                            <Image
                              src={gecko.profile_image}
                              alt={gecko.name}
                              fill
                              className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
                              unoptimized
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <span className="text-6xl opacity-10">🦎</span>
                            </div>
                          )}

                          {/* 성별 뱃지 */}
                          <div className="absolute top-2.5 right-2.5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold backdrop-blur-sm shadow-sm ${
                              gecko.gender === "Male"
                                ? "bg-sky-500/85 text-white"
                                : gecko.gender === "Female"
                                  ? "bg-rose-500/85 text-white"
                                  : "bg-black/50 text-white"
                            }`}>
                              {gecko.gender === "Male" ? "♂ 수컷" : gecko.gender === "Female" ? "♀ 암컷" : "미구분"}
                            </span>
                          </div>

                          {/* 배란 인디케이터 */}
                          {gecko.is_ovulating && gecko.gender === "Female" && (
                            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-white/90 dark:bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">배란중</span>
                            </div>
                          )}
                        </div>

                        <CardContent className="p-3.5 flex-1 flex flex-col gap-2.5">
                          {/* 이름 + 모프 */}
                          <div>
                            <h3 className="font-bold text-[15px] truncate group-hover:text-primary transition-colors duration-200">
                              {gecko.name}
                            </h3>
                            <p className="text-[12px] text-muted-foreground truncate mt-0.5">
                              {gecko.morph || "모프 정보 없음"}
                            </p>
                          </div>

                          {/* 스탯 */}
                          <div className="grid grid-cols-2 gap-1.5 mt-auto">
                            <div className="bg-muted/40 rounded-xl px-2.5 py-2 text-center">
                              <span className="block text-[13px] font-bold text-foreground/80">{gecko.birth_date || "—"}</span>
                              <span className="text-[10px] text-muted-foreground/80">생년월일</span>
                            </div>
                            <div className="bg-muted/40 rounded-xl px-2.5 py-2 text-center">
                              <span className="block text-[13px] font-bold text-foreground/80">{gecko.weight ? `${gecko.weight}g` : "—"}</span>
                              <span className="text-[10px] text-muted-foreground/80">몸무게</span>
                            </div>
                          </div>

                          {/* 퀵 액션 바 */}
                          <div
                            className="flex gap-1.5 pt-2 border-t border-border/30"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          >
                            <button
                              onClick={(e) => openFeedPanel(gecko.id, e)}
                              disabled={fedGeckoIds.has(gecko.id)}
                              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                fedGeckoIds.has(gecko.id)
                                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 cursor-default"
                                  : feedOpenId === gecko.id
                                    ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                    : "bg-muted/50 text-muted-foreground hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600"
                              }`}
                            >
                              {fedGeckoIds.has(gecko.id)
                                ? <><CheckCircle2 className="w-3 h-3" /> 완료</>
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
                              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                weightOpenId === gecko.id
                                  ? "bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400"
                                  : "bg-muted/50 text-muted-foreground hover:bg-sky-50 dark:hover:bg-sky-500/10 hover:text-sky-600"
                              }`}
                            >
                              ⚖️ 체중
                            </button>
                          </div>

                          {/* 피딩 노트 패널 */}
                          {feedOpenId === gecko.id && (
                            <div
                              role="region"
                              aria-label={`${gecko.name} 피딩 기록`}
                              className="flex flex-col gap-2 p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-700/30"
                              onClick={(e) => { e.stopPropagation(); }}
                            >
                              <div role="group" aria-label="먹이 선택" className="flex gap-1.5 flex-wrap">
                                {FEED_TYPES.map((ft) => (
                                  <button
                                    key={ft.id}
                                    type="button"
                                    aria-pressed={feedChoices.includes(ft.id)}
                                    onClick={() => setFeedChoices((prev) =>
                                      prev.includes(ft.id) ? prev.filter((c) => c !== ft.id) : [...prev, ft.id]
                                    )}
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all border ${
                                      feedChoices.includes(ft.id)
                                        ? "bg-emerald-600 text-white border-emerald-600"
                                        : "bg-white dark:bg-card text-muted-foreground border-border/50 hover:border-emerald-400 hover:text-emerald-600"
                                    }`}
                                  >
                                    {ft.label}
                                  </button>
                                ))}
                              </div>
                              {feedChoices.includes("직접입력") && (
                                <>
                                  <label htmlFor={`feed-custom-${gecko.id}`} className="sr-only">먹이 내용 직접 입력</label>
                                  <input
                                    id={`feed-custom-${gecko.id}`}
                                    type="text"
                                    value={feedCustomText}
                                    onChange={(e) => setFeedCustomText(e.target.value)}
                                    placeholder="먹이 내용 입력..."
                                    autoFocus
                                    className="px-2.5 py-1.5 text-xs rounded-xl border border-border/50 bg-white dark:bg-card focus:outline-none focus:ring-1 focus:ring-emerald-400"
                                    onKeyDown={(e) => {
                                      e.stopPropagation();
                                      if (e.key === "Enter") handleSubmitFeed(gecko.id, false);
                                      if (e.key === "Escape") setFeedOpenId(null);
                                    }}
                                  />
                                </>
                              )}
                              <label className="flex items-center gap-1.5 cursor-pointer w-fit" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={feedRemember}
                                  onChange={(e) => setFeedRemember(e.target.checked)}
                                  className="w-3 h-3 rounded accent-emerald-600"
                                />
                                <span className="text-[11px] text-muted-foreground font-medium">다음에도 기억하기</span>
                              </label>
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleSubmitFeed(gecko.id, true); }}
                                  disabled={feedSubmitting}
                                  className="flex-1 py-1.5 text-[11px] font-bold rounded-xl border border-border/50 bg-white dark:bg-card text-muted-foreground hover:bg-muted/30 transition-colors disabled:opacity-50"
                                >
                                  건너뛰기
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleSubmitFeed(gecko.id, false); }}
                                  disabled={feedSubmitting}
                                  className="flex-1 py-1.5 text-[11px] font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
                                >
                                  {feedSubmitting ? "저장중..." : "완료 🦗"}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* 체중 입력 */}
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
                                className="flex-1 px-2.5 py-1.5 text-xs rounded-xl border border-border/50 bg-background focus:outline-none focus:ring-1 focus:ring-sky-400"
                                onKeyDown={(e) => {
                                  e.stopPropagation();
                                  if (e.key === "Enter") handleQuickWeight(gecko.id, e);
                                  if (e.key === "Escape") { setWeightOpenId(null); setWeightValue(""); }
                                }}
                              />
                              <button
                                onClick={(e) => handleQuickWeight(gecko.id, e)}
                                className="px-3 py-1.5 text-xs rounded-xl bg-sky-500 text-white font-bold hover:bg-sky-400 transition-colors"
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
                  <div className="flex items-center justify-center gap-1.5 mt-8">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-9 h-9 flex items-center justify-center rounded-full border border-border/50 bg-card hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                        if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((item, idx) =>
                        item === "..." ? (
                          <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-muted-foreground/50 text-sm">···</span>
                        ) : (
                          <button
                            key={item}
                            onClick={() => setCurrentPage(item as number)}
                            className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold transition-all ${
                              currentPage === item
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "border border-border/50 bg-card hover:bg-muted text-foreground"
                            }`}
                          >
                            {item}
                          </button>
                        ),
                      )}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="w-9 h-9 flex items-center justify-center rounded-full border border-border/50 bg-card hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
