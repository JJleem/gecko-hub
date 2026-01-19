"use client";

import Image from "next/image";
import Link from "next/link";
import { CareLog, ParentGecko } from "../types/gecko"; // 경로 확인

// Props에 currentGeckoId 추가
export default function MatingTracker({
  logs,
  currentGeckoId,
}: {
  logs: CareLog[];
  currentGeckoId: number;
}) {
  const matingLogs = logs
    .filter((log) => log.log_type === "Mating")
    .sort(
      (a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime(),
    );

  // 🛠 [핵심 함수] 이미지 주소 변환 (엑박 방지 + 타입 에러 방지)
  // path가 있으면 http://... 를 붙여서 반환하고, 없으면 빈 문자열("") 반환
  const getFullImageUrl = (path: string | null): string => {
    if (!path) return "";
    return path.startsWith("http")
      ? path
      : `https://gecko-hub.vercel.app${path}`;
  };

  return (
    <div className="w-full bg-white p-6 rounded-xl shadow-sm border border-pink-100 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          💞 메이팅 기록 (Pairing Log)
        </h3>
        {matingLogs.length > 0 && (
          <span className="text-xs text-gray-400">최근 기록순</span>
        )}
      </div>

      {matingLogs.length > 0 ? (
        <div className="overflow-hidden border rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">날짜</th>
                <th className="px-4 py-3">파트너 (상대방)</th>
                <th className="px-4 py-3 text-center">결과</th>
                <th className="px-4 py-3">메모</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {matingLogs.map((log) => {
                // 🔥 상대방 찾기 로직
                let otherGecko: ParentGecko | undefined | null = null;
                let isExternal = false;
                let externalName = "";

                if (log.gecko === currentGeckoId) {
                  // 내가 쓴 글 -> 상대는 partner
                  otherGecko = log.partner_detail;
                  if (!otherGecko && log.partner_name) {
                    isExternal = true;
                    externalName = log.partner_name;
                  }
                } else {
                  // 남이 쓴 글 -> 상대는 gecko(작성자)
                  otherGecko = log.gecko_detail;
                }

                // 🔥 [중요] 여기서 이미지 주소를 미리 계산합니다.
                const imageUrl = otherGecko
                  ? getFullImageUrl(otherGecko.profile_image)
                  : "";

                return (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-800">
                      {log.log_date}
                    </td>
                    <td className="px-4 py-3">
                      {otherGecko ? (
                        <Link
                          href={`/geckos/${otherGecko.id}`}
                          className="flex items-center space-x-2 hover:bg-gray-100 p-1 rounded -ml-1 transition"
                        >
                          <div className="relative w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                            {/* 🔥 imageUrl이 빈 문자열이 아닐 때만 <Image> 렌더링 */}
                            {imageUrl ? (
                              <Image
                                src={imageUrl} // 이제 여긴 무조건 string입니다.
                                alt="partner"
                                fill
                                className="object-cover"
                                unoptimized // 엑박 방지용 필수 옵션
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-300" />
                            )}
                          </div>
                          <span className="font-medium text-blue-600 hover:underline">
                            {otherGecko.name}
                          </span>
                        </Link>
                      ) : isExternal ? (
                        <div className="flex items-center space-x-2 p-1">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-400 border">
                            ?
                          </div>
                          <span className="font-medium text-gray-700">
                            {externalName} (외부)
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {log.mating_success ? (
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                          성공
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">
                          실패
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{log.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-center">
          <div className="text-4xl mb-2">💞</div>
          <p className="text-gray-500 font-medium">
            아직 메이팅 기록이 없습니다.
          </p>
        </div>
      )}
    </div>
  );
}
