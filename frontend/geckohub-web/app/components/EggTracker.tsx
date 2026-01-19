"use client";

import { CareLog } from "../types/gecko";

export default function EggTracker({ logs }: { logs: CareLog[] }) {
  // 1. 산란 기록만 필터링 (최신순 정렬)
  const eggLogs = logs
    .filter((log) => log.log_type === "Laying")
    .sort(
      (a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime()
    );

  // 데이터가 없으면 렌더링 안 함
  if (eggLogs.length === 0) return null;

  // 2. 통계 계산
  const totalClutches = eggLogs.length; // 총 산란 횟수 (차수)
  const totalEggs = eggLogs.reduce((sum, log) => sum + (log.egg_count || 0), 0); // 총 알 개수
  const fertileClutches = eggLogs.filter((log) => log.is_fertile).length; // 유정란 횟수
  const fertilityRate = Math.round((fertileClutches / totalClutches) * 100); // 확률

  return (
    <div className="w-full bg-white p-6 rounded-xl shadow-sm border border-orange-100 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          🥚 산란 기록 (Breeding Log)
        </h3>
        <span className="text-xs text-gray-400">최근 기록순</span>
      </div>

      {/* 📊 상단 통계 요약 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-orange-50 p-4 rounded-lg text-center">
          <p className="text-xs text-gray-500 mb-1">총 클러치 (Clutches)</p>
          <p className="text-2xl font-bold text-orange-600">
            {totalClutches}차
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <p className="text-xs text-gray-500 mb-1">총 알 개수 (Eggs)</p>
          <p className="text-2xl font-bold text-yellow-600">{totalEggs}개</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <p className="text-xs text-gray-500 mb-1">유정란 확률 (Fertility)</p>
          <p className="text-2xl font-bold text-blue-600">{fertilityRate}%</p>
        </div>
      </div>

      {/* 📋 산란 리스트 테이블 */}
      <div className="overflow-hidden border rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">차수</th>
              <th className="px-4 py-3">산란일</th>
              <th className="px-4 py-3 text-center">개수</th>
              <th className="px-4 py-3 text-center">상태</th>
              <th className="px-4 py-3">알 컨디션 / 메모</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {eggLogs.map((log, index) => {
              // 역순이므로 차수 계산: 전체개수 - 인덱스
              const clutchNumber = totalClutches - index;

              return (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-500">
                    #{clutchNumber}차
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-800">
                    {log.log_date}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block w-6 h-6 leading-6 bg-gray-100 rounded-full text-xs font-bold">
                      {log.egg_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {log.is_fertile ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        ⭕ 유정란
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        ❌ 무정란
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 truncate max-w-50">
                    {log.egg_condition && (
                      <span className="mr-2 text-gray-800">
                        [{log.egg_condition}]
                      </span>
                    )}
                    {log.note}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
