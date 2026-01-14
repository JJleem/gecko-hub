"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Gecko } from "./types/gecko";
import LoginButton from "./components/LoginButton";
import { useSession } from "next-auth/react"; // 🔥 세션 훅 추가

export default function Home() {
  const { data: session, status } = useSession(); // 🔥 로그인 상태 가져오기
  const [geckos, setGeckos] = useState<Gecko[]>([]);
  const [loading, setLoading] = useState(false); // 초기값을 false로 변경 (세션 확인 후 로딩)
  const [incubatingCount, setIncubatingCount] = useState(0);

  useEffect(() => {
    // 1. 로그인이 안 되어 있거나 로딩 중이면 fetch 안 함
    if (status !== "authenticated" || !session?.user.djangoToken) {
      setGeckos([]); // 로그아웃 상태면 목록 비우기
      return;
    }

    const fetchGeckos = async () => {
      setLoading(true);
      try {
        // 2. 🔥 헤더에 Django 토큰을 실어서 보냄 (중요!)
        const res = await fetch("http://127.0.0.1:8000/api/geckos/", {
          headers: {
            Authorization: `Bearer ${session.user.djangoToken}`,
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            console.log("토큰 만료 혹은 인증 실패");
            return;
          }
          throw new Error("Failed to fetch");
        }

        const data: Gecko[] = await res.json();
        setGeckos(data);

        // 인큐베이팅 카운트 계산
        let count = 0;
        data.forEach((g) => {
          const eggs = g.logs.filter(
            (l) => l.log_type === "Laying" && l.expected_hatching_date
          );
          count += eggs.length;
        });
        setIncubatingCount(count);
      } catch (error) {
        console.error("Failed to fetch geckos", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGeckos();
  }, [session, status]); // 세션이나 상태가 바뀌면 다시 실행

  // 로딩 중 표시 (NextAuth 로딩 포함)
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

        {/* 🔥 비로그인 상태일 때 보여줄 화면 */}
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
              {/* 버튼을 눌러보게 유도하는 화살표 등 UI 추가 가능 */}
              ⬆️ 우측 상단 로그인 버튼을 눌러주세요
            </div>
          </div>
        ) : (
          /* 🔥 로그인 상태일 때만 대시보드와 리스트 표시 */
          <>
            {/* 상단 대시보드 */}
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
                    클러치 관리 중
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
