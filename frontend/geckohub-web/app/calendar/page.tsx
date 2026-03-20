"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useGeckoStore } from "@/app/stores/geckoStore";
import { CareLog } from "@/app/types/gecko";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";

// ── 타입 ──────────────────────────────────────────────
type LogWithGecko = CareLog & { geckoName: string; geckoId: number };

// ── 상수 ──────────────────────────────────────────────
const LOG_CONFIG: Record<string, { emoji: string; label: string }> = {
  Feeding:  { emoji: "🦗", label: "피딩" },
  Weight:   { emoji: "⚖️", label: "체중" },
  Mating:   { emoji: "💞", label: "메이팅" },
  Laying:   { emoji: "🥚", label: "산란" },
  Shedding: { emoji: "🐍", label: "탈피" },
  Cleaning: { emoji: "🧹", label: "청소" },
  Other:    { emoji: "📝", label: "기타" },
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// ── 컴포넌트 ──────────────────────────────────────────
export default function CalendarPage() {
  const { data: session, status } = useSession();
  const { geckos } = useGeckoStore();

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr);

  // 날짜별 로그 맵
  const logsByDate = useMemo(() => {
    const map: Record<string, LogWithGecko[]> = {};
    geckos.forEach((gecko) => {
      gecko.logs.forEach((log) => {
        if (!map[log.log_date]) map[log.log_date] = [];
        map[log.log_date].push({ ...log, geckoName: gecko.name, geckoId: gecko.id });
      });
    });
    return map;
  }, [geckos]);

  // 달력 셀 목록 (빈 칸 + 날짜)
  const calendarDays = useMemo(() => {
    const firstDow = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: Array<{ date: string | null; day: number | null }> = [];
    for (let i = 0; i < firstDow; i++) cells.push({ date: null, day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ date: dateStr, day: d });
    }
    return cells;
  }, [viewYear, viewMonth]);

  // 월 이동
  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
    setSelectedDate(null);
  };
  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(todayStr);
  };

  // 이번 달 통계
  const monthStats = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
    const stats: Record<string, number> = {};
    Object.entries(logsByDate).forEach(([date, logs]) => {
      if (!date.startsWith(prefix)) return;
      logs.forEach((log) => {
        stats[log.log_type] = (stats[log.log_type] ?? 0) + 1;
      });
    });
    return stats;
  }, [logsByDate, viewYear, viewMonth]);

  const selectedLogs = selectedDate ? (logsByDate[selectedDate] ?? []) : [];

  // ── 로딩 / 비로그인 ──────────────────────────────────
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground text-sm animate-pulse">로딩 중...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <span className="text-4xl opacity-30">🔒</span>
        <p className="text-muted-foreground text-sm">로그인이 필요해요</p>
        <Link href="/"><Button size="sm">홈으로</Button></Link>
      </div>
    );
  }

  // ── 렌더 ─────────────────────────────────────────────
  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl pb-24">

      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">사육 캘린더 📅</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            날짜별 사육일지를 한눈에 확인하세요
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={goToday} className="text-xs">
          오늘
        </Button>
      </div>

      {/* 이번 달 통계 칩 */}
      {Object.keys(monthStats).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {Object.entries(monthStats)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => {
              const cfg = LOG_CONFIG[type] ?? LOG_CONFIG.Other;
              return (
                <span
                  key={type}
                  className="flex items-center gap-1 text-xs bg-muted/50 border border-border/40 rounded-full px-2.5 py-1 font-medium"
                >
                  {cfg.emoji} {cfg.label}
                  <span className="text-primary font-bold ml-0.5">{count}</span>
                </span>
              );
            })}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-5 items-start">

        {/* ── 달력 ─────────────────────────────────────── */}
        <div className="flex-1 w-full">

          {/* 월 네비게이션 */}
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-base font-bold">
              {viewYear}년 {viewMonth + 1}월
            </h2>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((w, i) => (
              <div
                key={w}
                className={`text-center text-xs font-semibold py-1.5
                  ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-muted-foreground"}`}
              >
                {w}
              </div>
            ))}
          </div>

          {/* 날짜 셀 그리드 */}
          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map((cell, idx) => {
              if (!cell.date) {
                return <div key={`empty-${idx}`} className="aspect-square" />;
              }

              const logs = logsByDate[cell.date] ?? [];
              const isToday    = cell.date === todayStr;
              const isSelected = cell.date === selectedDate;
              const dow        = idx % 7; // 요일 (0=일, 6=토)
              const uniqueTypes = [...new Set(logs.map((l) => l.log_type))].slice(0, 3);

              return (
                <button
                  key={cell.date}
                  onClick={() => setSelectedDate(isSelected ? null : cell.date!)}
                  className={`
                    aspect-square rounded-xl p-0.5 flex flex-col items-center justify-start
                    transition-all duration-150 select-none
                    ${isSelected
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-95"
                      : isToday
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted/50"}
                  `}
                >
                  {/* 날짜 숫자 */}
                  <span
                    className={`text-xs font-semibold leading-none mt-1.5
                      ${isSelected
                        ? "text-primary-foreground"
                        : isToday
                          ? "text-primary font-bold"
                          : dow === 0
                            ? "text-red-500"
                            : dow === 6
                              ? "text-blue-500"
                              : "text-foreground"}
                    `}
                  >
                    {cell.day}
                  </span>

                  {/* 이모지 마크 */}
                  {uniqueTypes.length > 0 && (
                    <div className="flex flex-wrap gap-px justify-center mt-0.5">
                      {uniqueTypes.map((type) => {
                        const cfg = LOG_CONFIG[type] ?? LOG_CONFIG.Other;
                        return (
                          <span key={type} className="text-[11px] leading-none">
                            {cfg.emoji}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* 건수 */}
                  {logs.length > 0 && (
                    <span
                      className={`text-[9px] leading-none mt-0.5
                        ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                    >
                      {logs.length}건
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 상세 패널 ──────────────────────────────────── */}
        <div className="w-full lg:w-72 lg:sticky lg:top-20">
          {selectedDate ? (
            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
              {/* 패널 헤더 */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/20">
                <div>
                  <p className="text-sm font-bold">
                    {selectedDate.replace(/-/g, ".")}
                    {selectedDate === todayStr && (
                      <span className="ml-1.5 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full font-semibold">오늘</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedLogs.length > 0 ? `${selectedLogs.length}개 기록` : "기록 없음"}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 로그 목록 */}
              <div className="p-2 flex flex-col gap-1 max-h-[440px] overflow-y-auto">
                {selectedLogs.length === 0 ? (
                  <div className="flex flex-col items-center py-10 gap-2">
                    <span className="text-3xl opacity-20">📭</span>
                    <p className="text-sm text-muted-foreground">이 날 기록이 없어요</p>
                  </div>
                ) : (
                  selectedLogs.map((log) => {
                    const cfg = LOG_CONFIG[log.log_type] ?? LOG_CONFIG.Other;
                    return (
                      <Link key={log.id} href={`/geckos/${log.geckoId}`}>
                        <div className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group">
                          <span className="text-base leading-none mt-0.5 shrink-0">{cfg.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-semibold truncate group-hover:text-primary transition-colors">
                                {log.geckoName}
                              </span>
                              <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-full shrink-0">
                                {cfg.label}
                              </span>
                            </div>
                            {log.weight != null && (
                              <p className="text-xs text-muted-foreground mt-0.5">⚖️ {log.weight}g</p>
                            )}
                            {log.egg_count != null && (
                              <p className="text-xs text-muted-foreground mt-0.5">🥚 {log.egg_count}개</p>
                            )}
                            {log.note && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.note}</p>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex flex-col items-center justify-center h-48 text-center border-2 border-dashed border-border/40 rounded-2xl bg-muted/10">
              <span className="text-3xl mb-2 opacity-25">📅</span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                날짜를 클릭하면<br />기록을 볼 수 있어요
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
