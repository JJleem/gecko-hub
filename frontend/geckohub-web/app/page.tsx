"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Gecko } from "./types/gecko";
import { apiClient } from "@/lib/api";
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
  Clock,
  Plus,
  Settings2,
  ShieldAlert,
} from "lucide-react";

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
  const [loading, setLoading] = useState(true); // 초기값을 true로 설정

  // 피딩 스케줄 상태
  const [feedingDays, setFeedingDays] = useState<number[]>([]);
  const [isFeedingDay, setIsFeedingDay] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFedToday, setIsFedToday] = useState(false);

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

  // 게코 데이터 불러오기
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

    const fetchGeckos = async () => {
      try {
        if (!session?.user?.djangoToken) return;
        const res = await apiClient(session.user.djangoToken).get(
          "/api/geckos/",
        );

        if (!res.ok) throw new Error("Failed to fetch");

        const data: Gecko[] = await res.json();
        setGeckos(data);

        let fedCount = 0;
        const todayStr = new Date().toISOString().split("T")[0];

        data.forEach((g) => {
          const todayFeeding = g.logs.find(
            (l) => l.log_type === "Feeding" && l.log_date === todayStr,
          );
          if (todayFeeding) fedCount++;
        });

        setIsFedToday(data.length > 0 && fedCount > 0);
      } catch (error) {
        console.error("Failed to fetch geckos", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGeckos();
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
      toast.success("모든 개체에게 피딩 기록이 추가되었습니다! 🦗");
    } catch (error) {
      console.error(error);
      toast.error("일부 요청이 실패했을 수 있습니다.");
    }
  };

  // 렌더링 시작
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* 헤더 영역 */}

      <main className="container mx-auto p-4 md:p-8 pb-24">
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
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <ShieldAlert className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              나만의 게코 관리 매니저
            </h2>
            <p className="text-muted-foreground max-w-md text-lg">
              사랑스러운 크레스티드 게코들의 피딩, 메이팅, 해칭 일정을
              체계적으로 관리하세요.
            </p>
            <div className="pt-4 pointer-events-none opacity-60 flex items-center gap-2 text-sm font-medium">
              ⬆️ 우측 상단의 로그인 버튼을 눌러 시작하세요
            </div>
          </div>
        ) : (
          /* 로그인 완료 대시보드 UI */
          <div className="space-y-8 mt-2">
            {/* 상단 대시보드 위젯 영역 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 1. 피딩 스케줄러 위젯 */}
              <Card className="flex flex-col shadow-sm border-border/50">
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
                              : "bg-background border border-input text-muted-foreground hover:bg-muted"
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

              {/* 2. 인큐베이터 현황 (기존 컴포넌트 재사용) */}
              <div className="h-full">
                <IncubatorOverview />
              </div>

              {/* 3. 새 가족 등록 위젯 */}
              <Link href="/geckos/new" className="block h-full group">
                <Card className="h-full flex flex-col items-center justify-center border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer shadow-none">
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Plus className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">
                      새 가족 등록
                    </CardTitle>
                    <CardDescription>
                      새로운 게코의 프로필을 추가하세요
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* 게코 목록 영역 */}
            <div className="mt-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold tracking-tight">
                  내 게코 목록{" "}
                  <span className="text-muted-foreground text-lg font-normal ml-2">
                    ({geckos.length}마리)
                  </span>
                </h2>
              </div>

              {geckos.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-muted/20 border-dashed">
                  <span className="text-5xl mb-4">🦎</span>
                  <h3 className="text-lg font-bold">
                    아직 등록된 게코가 없습니다.
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    상단의 등록 위젯을 눌러 시작해보세요!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {geckos.map((gecko) => (
                    <Link
                      href={`/geckos/${gecko.id}`}
                      key={gecko.id}
                      className="group"
                    >
                      <Card className="overflow-hidden border-border/50 hover:shadow-md hover:border-primary/30 transition-all duration-300 bg-card h-full flex flex-col">
                        <div className="relative aspect-square w-full bg-muted">
                          {gecko.profile_image ? (
                            <Image
                              src={gecko.profile_image}
                              alt={gecko.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              unoptimized
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-5xl text-muted-foreground/30">
                              🦎
                            </div>
                          )}

                          {/* 성별 뱃지 */}
                          <div className="absolute top-3 right-3">
                            <Badge
                              variant={
                                gecko.gender === "Male"
                                  ? "default"
                                  : gecko.gender === "Female"
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="shadow-sm font-bold backdrop-blur-md bg-opacity-90"
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
                            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-background/90 backdrop-blur-sm px-2.5 py-1 rounded-full border border-border shadow-sm">
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                              <span className="text-xs font-bold text-foreground">
                                배란중
                              </span>
                            </div>
                          )}
                        </div>

                        <CardContent className="p-4 flex-1 flex flex-col">
                          <h3 className="text-xl font-bold truncate group-hover:text-primary transition-colors">
                            {gecko.name}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate mb-4 font-medium">
                            {gecko.morph || "모프 정보 없음"}
                          </p>
                          <div className="mt-auto flex items-center justify-between text-xs font-medium text-muted-foreground bg-muted/40 p-2.5 rounded-md border border-border/50">
                            <span>🎂 {gecko.birth_date || "미상"}</span>
                            <span>
                              ⚖️{" "}
                              {gecko.weight ? `${gecko.weight}g` : "무게 미상"}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
