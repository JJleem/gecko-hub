import DeleteButton from "@/app/components/DeleteButton";
import EggTracker from "@/app/components/EggTracker";
import MatingTracker from "@/app/components/MatingTracker"; // [추가]
import LogForm from "@/app/components/LogForm";
import WeightChart from "@/app/components/WeightChart";

import Image from "next/image";
import Link from "next/link";
import { Gecko } from "@/app/types/gecko";
import HatchingProgress from "@/app/components/HatchingProgress";
import IncubationSection from "@/app/components/IncubationSection";
import { cookies } from "next/headers";

// 데이터 가져오기 (SSR)
async function getGeckoDetail(id: string): Promise<Gecko> {
  console.log(`Fetching gecko id: ${id}`);
  const cookieStore = await cookies();
  // 2. 모든 쿠키를 가져와서 "이름=값; 이름=값" 형태의 문자열로 변환
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/geckos/${id}/`,
    {
      cache: "no-store",
      headers: {
        // 3. 변환된 쿠키 문자열을 헤더에 넣기
        Cookie: cookieHeader,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    if (res.status === 401) {
      console.error("인증 실패: 401 Unauthorized");
    }
    throw new Error(`Failed to fetch gecko details (Status: ${res.status})`);
  }

  return res.json();
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function GeckoDetail({ params }: Props) {
  const { id } = await params;
  const gecko = await getGeckoDetail(id);
  const activeEggs = gecko.logs
    .filter(
      (l) =>
        l.log_type === "Laying" &&
        l.expected_hatching_date &&
        // D-Day가 지났더라도 관리자가 완료 처리하기 전까진 보여주고 싶다면 아래 조건 조절
        new Date(l.expected_hatching_date) >=
          new Date(new Date().setHours(0, 0, 0, 0))
    )
    // 예정일이 가까운 순서대로 정렬
    .sort(
      (a, b) =>
        new Date(a.expected_hatching_date!).getTime() -
        new Date(b.expected_hatching_date!).getTime()
    );
  return (
    <main className="min-h-screen p-8 bg-gray-50 text-black">
      {/* 상단 네비게이션 */}
      <div className="flex justify-between items-center mb-6">
        <Link href="/" className="text-blue-500 hover:underline">
          &larr; 뒤로 가기
        </Link>

        <div className="flex items-center space-x-2">
          <Link
            href={`/geckos/${gecko.id}/edit`}
            className="px-3 py-1 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition"
          >
            수정
          </Link>
          <DeleteButton id={gecko.id} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <IncubationSection activeEggs={activeEggs} />
        {/* ========================================== */}
        {/* 1. 프로필 영역 */}
        {/* ========================================== */}
        <div className="md:flex-col px-4 ">
          <div className="flex items-center justify-center">
            <div className="md:w-1/2 relative h-80 bg-gray-200">
              {gecko.profile_image ? (
                <Image
                  src={gecko.profile_image}
                  alt={gecko.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No Image
                </div>
              )}
            </div>
            <div className="p-8 md:w-1/2">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                {gecko.name}
                {gecko.is_ovulating &&
                  (gecko.gender === "Female" ? (
                    <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full border border-red-200">
                      🥚 배란중 (Ovulating)
                    </span>
                  ) : gecko.gender === "Male" ? (
                    <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full border border-blue-200">
                      🔥 발정 (Rut)
                    </span>
                  ) : null)}
              </h1>
              <p className="text-gray-500 mb-6">
                {gecko.morph || "모프 정보 없음"}
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {/* 1. 입양 출처 뱃지 */}
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                  {gecko.acquisition_type === "Hatched"
                    ? "🐣 직접 해칭"
                    : gecko.acquisition_type === "Rescue"
                    ? "🚑 구조"
                    : "🏠 입양"}
                  {gecko.acquisition_type !== "Hatched" &&
                    gecko.acquisition_source && (
                      <span className="ml-1 border-l border-gray-300 pl-1 text-gray-500">
                        {gecko.acquisition_source}
                      </span>
                    )}
                </span>

                {/* 2. 건강/특징 뱃지 (조건부 렌더링) */}
                {gecko.tail_loss && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                    ✂️ 꼬리 부절
                  </span>
                )}
                {gecko.mbd && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                    🦴 MBD 이력
                  </span>
                )}
                {gecko.has_spots && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-white border border-gray-600">
                    ⚫ 점 있음
                  </span>
                )}
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">성별</span>
                  <span className="font-medium">
                    {gecko.gender === "Male"
                      ? "수컷"
                      : gecko.gender === "Female"
                      ? "암컷"
                      : "미구분"}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">해칭일</span>
                  <span className="font-medium">{gecko.birth_date || "-"}</span>
                </div>

                {/* 혈통 정보 (Lineage) */}
                <div className="pt-4 mt-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 border-l-4 border-blue-500 pl-2">
                    🧬 혈통 정보 (Lineage)
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* 아빠 (Sire) */}
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 mb-1">
                        부 (Sire)
                      </span>

                      {/* 1. 내부 개체 ID가 있을 때 (클릭 가능한 카드) */}
                      {gecko.sire_detail ? (
                        <Link
                          href={`/geckos/${gecko.sire_detail.id}`}
                          className="flex items-center p-2 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition group"
                        >
                          {/* 이미지 영역 */}
                          <div className="relative w-10 h-10 bg-gray-200 rounded-full overflow-hidden border border-blue-200 mr-3 group-hover:scale-105 transition-transform">
                            {gecko.sire_detail.profile_image ? (
                              <Image
                                src={gecko.sire_detail.profile_image}
                                alt={gecko.sire_detail.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-[10px] text-gray-400 font-bold">
                                NO IMG
                              </div>
                            )}
                          </div>
                          {/* 텍스트 영역 */}
                          <div className="overflow-hidden">
                            <p className="text-sm font-bold text-gray-800 truncate group-hover:text-blue-700">
                              {gecko.sire_detail.name}
                            </p>
                            <p className="text-[10px] text-gray-500 truncate">
                              {gecko.sire_detail.morph || "모프 정보 없음"}
                            </p>
                          </div>
                        </Link>
                      ) : gecko.sire_name ? (
                        /* 2. 직접 입력한 이름이 있을 때 (단순 텍스트) */
                        <div className="flex items-center p-2 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3 text-lg">
                            🦕
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-700">
                              {gecko.sire_name}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              외부 개체
                            </p>
                          </div>
                        </div>
                      ) : (
                        /* 3. 아무것도 없을 때 */
                        <div className="p-2 bg-gray-50 rounded-lg text-sm text-gray-400 border border-gray-100 flex items-center justify-center h-14.5">
                          정보 없음
                        </div>
                      )}
                    </div>

                    {/* 엄마 (Dam) */}
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 mb-1">
                        모 (Dam)
                      </span>

                      {/* 1. 내부 개체 ID가 있을 때 (클릭 가능한 카드) */}
                      {gecko.dam_detail ? (
                        <Link
                          href={`/geckos/${gecko.dam_detail.id}`}
                          className="flex items-center p-2 bg-pink-50 rounded-lg border border-pink-100 hover:bg-pink-100 transition group"
                        >
                          {/* 이미지 영역 */}
                          <div className="relative w-10 h-10 bg-gray-200 rounded-full overflow-hidden border border-pink-200 mr-3 group-hover:scale-105 transition-transform">
                            {gecko.dam_detail.profile_image ? (
                              <Image
                                src={gecko.dam_detail.profile_image}
                                alt={gecko.dam_detail.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-[10px] text-gray-400 font-bold">
                                NO IMG
                              </div>
                            )}
                          </div>
                          {/* 텍스트 영역 */}
                          <div className="overflow-hidden">
                            <p className="text-sm font-bold text-gray-800 truncate group-hover:text-pink-700">
                              {gecko.dam_detail.name}
                            </p>
                            <p className="text-[10px] text-gray-500 truncate">
                              {gecko.dam_detail.morph || "모프 정보 없음"}
                            </p>
                          </div>
                        </Link>
                      ) : gecko.dam_name ? (
                        /* 2. 직접 입력한 이름이 있을 때 (단순 텍스트) */
                        <div className="flex items-center p-2 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3 text-lg">
                            🦎
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-700">
                              {gecko.dam_name}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              외부 개체
                            </p>
                          </div>
                        </div>
                      ) : (
                        /* 3. 아무것도 없을 때 */
                        <div className="p-2 bg-gray-50 rounded-lg text-sm text-gray-400 border border-gray-100 flex items-center justify-center h-14.5">
                          정보 없음
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className=" p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
            {gecko.description || "특이사항이 없습니다."}
          </div>
        </div>
        {/* ========================================== */}
        {/* 2. 통합 사육 일지 (입력 폼 & 테이블) */}
        {/* ========================================== */}
        <div className="p-8 border-t">
          <h2 className="text-xl font-bold mb-4">📝 사육 일지</h2>

          {/* 입력 폼 (성별 전달) */}
          <LogForm geckoId={gecko.id} currentGender={gecko.gender} />

          {gecko.logs && gecko.logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600 uppercase">
                  <tr>
                    <th className="px-4 py-3">날짜</th>
                    <th className="px-4 py-3">타입</th>
                    <th className="px-4 py-3">내용 (무게/알/파트너)</th>
                    <th className="px-4 py-3">메모</th>
                  </tr>
                </thead>
                <tbody>
                  {gecko.logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{log.log_date}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs text-white
                          ${
                            log.log_type === "Feeding"
                              ? "bg-green-500"
                              : log.log_type === "Weight"
                              ? "bg-blue-500"
                              : log.log_type === "Laying"
                              ? "bg-orange-500"
                              : log.log_type === "Mating"
                              ? "bg-pink-500"
                              : "bg-gray-500"
                          }`}
                        >
                          {log.log_type === "Laying"
                            ? "🥚 산란"
                            : log.log_type === "Mating"
                            ? "💞 메이팅"
                            : log.log_type}
                        </span>
                      </td>

                      {/* 내용 표시 (분기 처리) */}
                      <td className="px-4 py-3">
                        {/* 1. 무게 */}
                        {log.log_type === "Weight" && log.weight ? (
                          <span className="font-bold">{log.weight}g</span>
                        ) : /* 2. 산란 */
                        log.log_type === "Laying" ? (
                          <div className="flex items-center text-sm">
                            <span
                              className={
                                log.is_fertile
                                  ? "text-blue-600 font-bold"
                                  : "text-red-500 font-bold"
                              }
                            >
                              {log.is_fertile ? "유정란" : "무정란"}
                            </span>
                            <span className="mx-2 text-gray-300">|</span>
                            <span className="font-medium">
                              {log.egg_count}개
                            </span>
                            {log.egg_condition && (
                              <span className="ml-2 text-xs text-gray-500">
                                ({log.egg_condition})
                              </span>
                            )}
                          </div>
                        ) : /* 3. 메이팅 (링크 추가) */
                        log.log_type === "Mating" ? (
                          <div className="flex items-center space-x-2">
                            <span>{log.mating_success ? "✅" : "❌"}</span>

                            {/* 🔥 로직 적용: 내가 쓴 글이면 partner를, 남이 쓴 글이면 작성자(gecko)를 보여줌 */}
                            {(() => {
                              const isMine = log.gecko === gecko.id; // 이 로그가 내 것인가?
                              const other = isMine
                                ? log.partner_detail
                                : log.gecko_detail; // 상대방 객체
                              const externalName = isMine
                                ? log.partner_name
                                : ""; // 외부 이름

                              if (other) {
                                return (
                                  <Link
                                    href={`/geckos/${other.id}`}
                                    className="flex items-center space-x-1 text-blue-600 hover:underline font-bold"
                                  >
                                    <span>with {other.name}</span>
                                    <span className="text-[10px] text-gray-400">
                                      ↗
                                    </span>
                                  </Link>
                                );
                              } else if (externalName) {
                                return (
                                  <span className="text-gray-700 font-bold">
                                    with {externalName} (외부)
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="text-gray-400">
                                    파트너 정보 없음
                                  </span>
                                );
                              }
                            })()}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{log.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              아직 기록이 없습니다.
            </p>
          )}
        </div>
        {/* ========================================== */}
        {/* 3. 대시보드 영역 (그래프 & 트래커) */}
        {/* ========================================== */}

        {/* 몸무게 그래프 */}
        <div className="p-8 border-t">
          <WeightChart logs={gecko.logs} />
        </div>

        {/* 메이팅 기록 (수컷/암컷 모두 표시) */}
        <div className="px-8 pb-4">
          <MatingTracker logs={gecko.logs} currentGeckoId={gecko.id} />
        </div>

        {/* 산란 기록 (암컷만 표시) */}
        {gecko.gender === "Female" && (
          <div className="px-8 pb-4">
            <EggTracker logs={gecko.logs} />
          </div>
        )}
      </div>
    </main>
  );
}
