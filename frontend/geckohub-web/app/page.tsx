"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Gecko } from "./types/gecko";
import LoginButton from "./components/LoginButton";
import { useSession } from "next-auth/react";

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
  const [loading, setLoading] = useState(false);
  const [incubatingCount, setIncubatingCount] = useState(0);

  // 피딩 스케줄 상태
  const [feedingDays, setFeedingDays] = useState<number[]>([]);
  const [isFeedingDay, setIsFeedingDay] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // 🔥 [추가] 오늘 이미 밥을 줬는지 확인하는 상태
  const [isFedToday, setIsFedToday] = useState(false);

  // DB에서 설정 불러오기
  useEffect(() => {
    if (!session?.user?.djangoToken) return;

    const fetchSettings = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/settings/`,
          {
            headers: {
              Authorization: `Bearer ${session.user.djangoToken}`,
            },
          }
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

  // 게코 데이터 불러오기 및 오늘 피딩 여부 확인
  useEffect(() => {
    if (status !== "authenticated" || !session?.user.djangoToken) {
      setGeckos([]);
      return;
    }

    const fetchGeckos = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/geckos/`,
          {
            headers: {
              Authorization: `Bearer ${session.user.djangoToken}`,
            },
          }
        );

        if (!res.ok) {
          if (res.status === 401) return;
          throw new Error("Failed to fetch");
        }

        const data: Gecko[] = await res.json();
        setGeckos(data);

        // 🔥 [수정] 알 개수 계산 로직 개선 (중복 제거)
        let fedCount = 0;
        const todayStr = new Date().toISOString().split("T")[0];

        // 1. 모든 게코의 로그를 하나로 모읍니다.
        const allLogs = data.flatMap((g) => g.logs);

        // 2. 로그 ID를 기준으로 중복을 제거합니다. (Map 사용)
        const uniqueLogs = new Map();
        allLogs.forEach((log) => {
          uniqueLogs.set(log.id, log);
        });

        // 3. 중복 없는 로그들 중에서 'Laying' 타입만 골라 알 개수를 더합니다.
        let totalEggs = 0;
        for (const log of uniqueLogs.values()) {
          // 인큐베이팅 카운트 (Laying이면서 해칭일이 있는 경우)
          if (log.log_type === "Laying" && log.expected_hatching_date) {
            totalEggs += log.egg_count || 0;
          }
        }

        // 4. 피딩 카운트 (개체별로 확인해야 함)
        data.forEach((g) => {
          const todayFeeding = g.logs.find(
            (l) => l.log_type === "Feeding" && l.log_date === todayStr
          );
          if (todayFeeding) fedCount++;
        });

        setIncubatingCount(totalEggs); // 정확한 알 개수 저장

        if (data.length > 0 && fedCount > 0) {
          setIsFedToday(true);
        } else {
          setIsFedToday(false);
        }
      } catch (error) {
        console.error("Failed to fetch geckos", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGeckos();
  }, [session, status]); // isFedToday가 바뀌어도 다시 실행할 필요 없음 (무한루프 방지)

  // 설정 변경 시 DB에 저장
  const toggleDay = async (dayId: number) => {
    if (!session?.user?.djangoToken) return;

    let newDays = [];
    if (feedingDays.includes(dayId)) {
      newDays = feedingDays.filter((d) => d !== dayId);
    } else {
      newDays = [...feedingDays, dayId];
    }

    setFeedingDays(newDays);

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.djangoToken}`,
        },
        body: JSON.stringify({ feeding_days: newDays }),
      });
    } catch (error) {
      console.error("설정 저장 실패", error);
      alert("설정 저장에 실패했습니다.");
    }
  };

  const handleBulkFeeding = async () => {
    if (geckos.length === 0) return;
    if (!confirm(`총 ${geckos.length}마리에게 피딩 기록을 추가하시겠습니까?`))
      return;

    const todayStr = new Date().toISOString().split("T")[0];

    try {
      const promises = geckos.map((gecko) =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/logs/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user.djangoToken}`,
          },
          body: JSON.stringify({
            gecko: gecko.id,
            log_type: "Feeding",
            log_date: todayStr,
            note: "일괄 피딩 완료 ✅",
          }),
        })
      );

      await Promise.all(promises);

      // 🔥 [추가] 피딩 완료 후 상태 즉시 변경
      setIsFedToday(true);
      alert("모든 개체에게 피딩 기록이 추가되었습니다! 🦗");

      // (선택) 데이터 새로고침이 필요하다면 여기서 fetchGeckos 로직을 다시 호출하거나 새로고침
      // router.refresh()
    } catch (error) {
      console.error(error);
      alert("일부 요청이 실패했을 수 있습니다.");
    }
  };

  if (status === "loading" || loading)
    return <div className="p-8 text-center text-gray-800">로딩 중...</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-6 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            🦎 GeckoHub
          </h1>
          <LoginButton />
        </div>

        {!session ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="text-6xl mb-6">👋</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              나만의 게코 관리 매니저
            </h2>
            <p className="text-gray-600 mb-8">
              로그인하고 내 도마뱀들의 기록을 관리해보세요.
            </p>
            <div className="inline-block pointer-events-none opacity-50">
              ⬆️ 우측 상단 로그인 버튼을 눌러주세요
            </div>
          </div>
        ) : (
          <>
            {/* 피딩 스케줄 관리 카드 */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-8">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  🍽️ 피딩 스케줄러
                </h2>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                >
                  {showSettings ? "설정 닫기" : "요일 설정"}
                </button>
              </div>

              {showSettings && (
                <div className="flex gap-2 mb-4 justify-center bg-gray-50 p-3 rounded-lg">
                  {DAYS.map((day) => (
                    <button
                      key={day.id}
                      onClick={() => toggleDay(day.id)}
                      className={`w-8 h-8 rounded-full text-sm font-bold transition ${
                        feedingDays.includes(day.id)
                          ? "bg-green-500 text-white shadow-md"
                          : "bg-white text-gray-400 border border-gray-200"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              )}

              <div
                className={`p-4 rounded-xl text-center transition-colors duration-300 ${
                  isFedToday
                    ? "bg-blue-50 border border-blue-100" // 피딩 완료 시 파란색
                    : isFeedingDay
                    ? "bg-green-50 border border-green-100" // 피딩 날짜면 초록색
                    : "bg-gray-50 border border-gray-100" // 평소엔 회색
                }`}
              >
                {isFeedingDay ? (
                  <div>
                    {isFedToday ? (
                      // 🔥 [추가] 피딩 완료 시 보여줄 화면
                      <div>
                        <p className="text-blue-700 font-bold text-lg mb-1">
                          ✅ 오늘의 피딩 완료!
                        </p>
                        <p className="text-xs text-blue-500">
                          수고하셨습니다. 내일도 화이팅! 💪
                        </p>
                      </div>
                    ) : (
                      // 🔥 [기존] 피딩 안 했을 때 버튼 노출
                      <div>
                        <p className="text-green-700 font-bold text-lg mb-3 animate-pulse">
                          🔔 오늘은 피딩 날짜입니다!
                        </p>
                        <button
                          onClick={handleBulkFeeding}
                          className="bg-green-600 text-white px-6 py-3 rounded-full font-bold shadow-md hover:bg-green-700 active:scale-95 transition flex items-center gap-2 mx-auto"
                        >
                          🦗 전체 피딩 완료 (일괄 기록)
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-500 mb-1">
                      오늘은 쉬는 날입니다 💤
                    </p>
                    {feedingDays.length > 0 ? (
                      <p className="text-xs text-gray-400">
                        설정된 요일:{" "}
                        {feedingDays
                          .sort()
                          .map((d) => DAYS[d].label)
                          .join(", ")}
                      </p>
                    ) : (
                      <p className="text-xs text-orange-400">
                        피딩 요일을 설정해주세요!
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 나머지 대시보드 및 리스트는 기존 코드 유지 ... */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <Link
                href="/incubator"
                className="bg-yellow-100 p-5 rounded-2xl border border-yellow-200 shadow-sm hover:shadow-md transition flex items-center justify-between group"
              >
                <div>
                  <div className="text-yellow-900 font-bold text-lg mb-1 group-hover:underline">
                    🥚 인큐베이터
                  </div>
                  <div className="text-yellow-700 text-sm">
                    현재{" "}
                    <span className="font-bold text-2xl mx-1">
                      {incubatingCount}
                    </span>
                    개의 알 케어 중
                  </div>
                </div>
                <div className="text-4xl group-hover:scale-110 transition">
                  🌡️
                </div>
              </Link>

              <Link
                href="/geckos/new"
                className="bg-blue-100 p-5 rounded-2xl border border-blue-200 shadow-sm hover:shadow-md transition flex items-center justify-between group"
              >
                <div>
                  <div className="text-blue-900 font-bold text-lg mb-1 group-hover:underline">
                    ✨ 새 가족 등록
                  </div>
                  <div className="text-blue-700 text-sm font-medium">
                    새로운 게코를 데려오셨나요?
                  </div>
                </div>
                <div className="text-4xl group-hover:scale-110 transition">
                  ➕
                </div>
              </Link>
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-4 px-1">
              내 게코 목록 ({geckos.length}마리)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {geckos.map((gecko) => (
                <Link
                  href={`/geckos/${gecko.id}`}
                  key={gecko.id}
                  className="block bg-white rounded-xl shadow-sm hover:shadow-lg transition duration-200 overflow-hidden border border-gray-100 group"
                >
                  <div className="relative h-48 bg-gray-200">
                    {gecko.profile_image ? (
                      <Image
                        src={gecko.profile_image}
                        alt={gecko.name}
                        fill
                        className="object-cover group-hover:scale-105 transition duration-500"
                        unoptimized
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-4xl">
                        🦎
                      </div>
                    )}

                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-xs font-bold shadow-sm text-gray-800">
                      {gecko.gender === "Male"
                        ? "♂️ 수컷"
                        : gecko.gender === "Female"
                        ? "♀️ 암컷"
                        : "미구분"}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex justify-between items-center mb-1">
                      <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition">
                        {gecko.name}
                      </h2>
                      {gecko.is_ovulating && (
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            gecko.gender === "Female"
                              ? "bg-red-500 animate-pulse"
                              : "bg-blue-500"
                          }`}
                        ></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3 truncate font-medium">
                      {gecko.morph || "모프 정보 없음"}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-gray-500 border-t pt-3 font-semibold">
                      <span>🎂 {gecko.birth_date || "미상"}</span>
                      <span>•</span>
                      <span>
                        {gecko.weight ? `${gecko.weight}g` : "무게 없음"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {geckos.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                <div className="text-6xl mb-4">🦖</div>
                <p className="text-lg font-bold">
                  아직 등록된 게코가 없습니다.
                </p>
                <p className="text-sm mt-2 font-medium">
                  상단의 새 가족 등록을 눌러 시작해보세요!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
