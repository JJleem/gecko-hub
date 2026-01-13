import LogForm from "@/app/components/LogForm";
import { Gecko } from "@/app/types/gecko";
import Image from "next/image";
import Link from "next/link";

// 데이터 가져오기 (SSR)
async function getGeckoDetail(id: string): Promise<Gecko> {
  // id가 제대로 넘어오는지 확인
  console.log(`Fetching gecko id: ${id}`);

  const res = await fetch(`http://127.0.0.1:8000/api/geckos/${id}/`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch gecko details (Status: ${res.status})`);
  }

  return res.json();
}

// [변경] Props 타입 정의 (params를 Promise로 감싸야 함)
type Props = {
  params: Promise<{ id: string }>;
};

// [변경] 컴포넌트 함수 수정
export default async function GeckoDetail({ params }: Props) {
  // [변경] params를 먼저 await 해서 id를 꺼냅니다.
  const { id } = await params;

  // 이제 id를 사용해서 데이터를 가져옵니다.
  const gecko = await getGeckoDetail(id);

  return (
    <main className="min-h-screen p-8 bg-gray-50 text-black">
      {/* 상단 네비게이션 */}
      <Link
        href="/"
        className="text-blue-500 hover:underline mb-6 inline-block"
      >
        &larr; 뒤로 가기
      </Link>

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* 1. 프로필 영역 */}
        <div className="md:flex">
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
            <h1 className="text-3xl font-bold mb-2">{gecko.name}</h1>
            <p className="text-gray-500 mb-6">
              {gecko.morph || "모프 정보 없음"}
            </p>

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
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">부 (Sire)</span>
                <span className="font-medium">
                  {gecko.sire ? `ID: ${gecko.sire}` : "Unknown"}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">모 (Dam)</span>
                <span className="font-medium">
                  {gecko.dam ? `ID: ${gecko.dam}` : "Unknown"}
                </span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
              {gecko.description || "특이사항이 없습니다."}
            </div>
          </div>
        </div>

        {/* 2. 사육 기록 (Logs) 영역 */}
        <div className="p-8 border-t">
          <h2 className="text-xl font-bold mb-4">📝 사육 일지</h2>
          <LogForm geckoId={gecko.id} />
          {gecko.logs && gecko.logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600 uppercase">
                  <tr>
                    <th className="px-4 py-3">날짜</th>
                    <th className="px-4 py-3">타입</th>
                    <th className="px-4 py-3">무게(g)</th>
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
                              : "bg-gray-500"
                          }`}
                        >
                          {log.log_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold">
                        {log.weight ? `${log.weight}g` : "-"}
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
      </div>
    </main>
  );
}
