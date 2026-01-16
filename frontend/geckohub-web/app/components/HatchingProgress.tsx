"use client";

interface HatchingProgressProps {
  layDate: string;
  expectedDate: string;
  temp: number;
  eggCount: number;
}

export default function HatchingProgress({
  layDate,
  expectedDate,
  temp,
  eggCount,
}: HatchingProgressProps) {
  const start = new Date(layDate).getTime();
  const end = new Date(expectedDate).getTime();
  const now = new Date().getTime();

  const totalDuration = end - start;
  const elapsed = now - start;

  let progress = Math.floor((elapsed / totalDuration) * 100);
  progress = Math.max(0, Math.min(100, progress));

  const dday = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-white border border-yellow-100 rounded-2xl p-4 shadow-sm mb-4 relative overflow-hidden">
      {/* 배경 데코레이션 */}
      <div className="absolute -right-2 -top-2 text-4xl opacity-10">🥚</div>

      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-yellow-400 text-white px-2 py-0.5 rounded-full">
              Incubating
            </span>
            <span className="text-xs font-bold text-gray-400">
              {eggCount}개의 알
            </span>
          </div>
          <h3 className="text-sm font-bold text-gray-700 mt-1">
            {temp}°C 설정
          </h3>
        </div>
        <div className="text-right">
          <span
            className={`text-xl font-black ${
              dday <= 7 ? "text-red-500 animate-pulse" : "text-blue-600"
            }`}
          >
            {dday === 0
              ? "D-Day 🎉"
              : dday < 0
              ? `D+${Math.abs(dday)}`
              : `D-${dday}`}
          </span>
        </div>
      </div>

      {/* 프로그레스 바 트랙 */}
      <div className="relative w-full h-4 bg-gray-100 rounded-full border border-gray-50 mt-4 mb-2">
        {/* 진행 바 */}
        <div
          className="h-full bg-linear-to-r from-yellow-300 via-orange-400 to-orange-500 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />

        {/* 🔥 움직이는 아기 게코 아이콘 */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -ml-3 transition-all duration-1000 ease-out text-xl"
          style={{ left: `${progress}%` }}
        >
          🦎
        </div>
      </div>

      <div className="flex justify-between text-[10px] font-bold text-gray-400 px-1">
        <span>{layDate} 산란</span>
        <span className="text-orange-500">{progress}% 부화 진행 중</span>
        <span>{expectedDate} 예정</span>
      </div>
    </div>
  );
}
