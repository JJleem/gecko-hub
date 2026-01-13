"use client"; // 클라이언트 컴포넌트 선언

import { useState } from "react";
import HatchingProgress from "@/app/components/HatchingProgress";
import { CareLog } from "@/app/types/gecko";

interface Props {
  activeEggs: CareLog[];
}

export default function IncubationSection({ activeEggs }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (activeEggs.length === 0) return null;

  const firstEgg = activeEggs[0];
  const otherEggs = activeEggs.slice(1);

  return (
    <div className="p-8 pb-0">
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 px-1">
        🥚 진행 중인 인큐베이팅
        <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full">
          {activeEggs.length}
        </span>
      </h2>

      <div className="space-y-3">
        {/* 첫 번째 알 */}
        <HatchingProgress
          layDate={firstEgg.log_date}
          expectedDate={firstEgg.expected_hatching_date!}
          temp={firstEgg.incubation_temp || 24.0}
          eggCount={firstEgg.egg_count || 1}
        />

        {/* 나머지 알 아코디언 */}
        {otherEggs.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full py-2 flex items-center justify-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors bg-white/50 rounded-xl border border-dashed border-gray-200"
            >
              {isExpanded ? (
                <>
                  접기{" "}
                  <span className="rotate-180 transition-transform">▼</span>
                </>
              ) : (
                <>
                  남은 {otherEggs.length}개의 클러치 더 보기 <span>▼</span>
                </>
              )}
            </button>

            <div
              className={`space-y-3 overflow-hidden transition-all duration-500 ease-in-out ${
                isExpanded
                  ? "max-h-[2000px] mt-3 opacity-100"
                  : "max-h-0 opacity-0"
              }`}
            >
              {otherEggs.map((egg) => (
                <HatchingProgress
                  key={egg.id}
                  layDate={egg.log_date}
                  expectedDate={egg.expected_hatching_date!}
                  temp={egg.incubation_temp || 24.0}
                  eggCount={egg.egg_count || 1}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
