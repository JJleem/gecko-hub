import DeleteButton from "@/app/components/DeleteButton";
import LogForm from "@/app/components/LogForm";
import WeightChart from "@/app/components/WeightChart";
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
      <div className="flex justify-between items-center mb-6">
        <Link href="/" className="text-blue-500 hover:underline">
          &larr; 뒤로 가기
        </Link>

        <div className="flex items-center space-x-2">
          {/* 수정 버튼 (Link) */}
          <Link
            href={`/geckos/${gecko.id}/edit`}
            className="px-3 py-1 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition"
          >
            수정
          </Link>
          {/* 삭제 버튼 (Component) */}
          <DeleteButton id={gecko.id} />
        </div>
      </div>
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
              {/* 부모 정보 (Link 카드 형태) */}
              <div className=" pt-4 mt-4">
                <h3 className="text-sm font-bold text-gray-500 mb-3">
                  🩸 혈통 정보 (Lineage)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* 아빠 (Sire) */}
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400 mb-1">
                      부 (Sire)
                    </span>
                    {gecko.sire_detail ? (
                      <Link
                        href={`/geckos/${gecko.sire_detail.id}`}
                        className="flex items-center p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition border border-blue-100"
                      >
                        <div className="relative w-10 h-10 rounded-full bg-gray-300 overflow-hidden mr-3 flex-shrink-0">
                          {gecko.sire_detail.profile_image ? (
                            <Image
                              src={gecko.sire_detail.profile_image}
                              alt="Sire"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-300" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">
                            {gecko.sire_detail.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            View Profile &rarr;
                          </p>
                        </div>
                      </Link>
                    ) : (
                      <div className="p-2 bg-gray-50 rounded-lg text-sm text-gray-400 border border-gray-100">
                        정보 없음 (Unknown)
                      </div>
                    )}
                  </div>

                  {/* 엄마 (Dam) */}
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400 mb-1">모 (Dam)</span>
                    {gecko.dam_detail ? (
                      <Link
                        href={`/geckos/${gecko.dam_detail.id}`}
                        className="flex items-center p-2 bg-pink-50 rounded-lg hover:bg-pink-100 transition border border-pink-100"
                      >
                        <div className="relative w-10 h-10 rounded-full bg-gray-300 overflow-hidden mr-3 flex-shrink-0">
                          {gecko.dam_detail.profile_image ? (
                            <Image
                              src={gecko.dam_detail.profile_image}
                              alt="Dam"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-300" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">
                            {gecko.dam_detail.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            View Profile &rarr;
                          </p>
                        </div>
                      </Link>
                    ) : (
                      <div className="p-2 bg-gray-50 rounded-lg text-sm text-gray-400 border border-gray-100">
                        정보 없음 (Unknown)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
              {gecko.description || "특이사항이 없습니다."}
            </div>
          </div>
        </div>
        {/* 그래프 영역 (프로필 밑, 로그 위) */}
        <div className="p-8 border-t">
          <WeightChart logs={gecko.logs} />
        </div>

        {/* 사육 기록 (Logs) 영역 */}
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
