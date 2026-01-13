// app/page.tsx
import Image from "next/image";
import { Gecko } from "./types/gecko";
import Link from "next/link";

// 백엔드 데이터 가져오는 함수
async function getGeckos(): Promise<Gecko[]> {
  const res = await fetch("http://localhost:8000/api/geckos/", {
    cache: "no-store",
  });

  if (!res.ok) {
    // 에러 처리를 조금 더 안전하게 (서버가 꺼져있을 때 등)
    console.error("Failed to fetch geckos");
    return [];
  }

  return res.json();
}

export default async function Home() {
  const geckos = await getGeckos();
  console.log(geckos);
  return (
    <main className="min-h-screen p-8 bg-gray-100 text-black">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">b</h1>
        <Link
          href="/geckos/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          + 새 개체 등록
        </Link>
      </div>
      {/* 그리드 레이아웃 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {geckos.map((gecko) => (
          <Link
            href={`/geckos/${gecko.id}`}
            key={gecko.id}
            className="block bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer"
          >
            <div className="relative h-48 w-full bg-gray-200">
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

            <div className="p-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold">{gecko.name}</h2>
                {/* 성별 뱃지 스타일링 */}
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold
                  ${
                    gecko.gender === "Male"
                      ? "bg-blue-100 text-blue-800"
                      : gecko.gender === "Female"
                      ? "bg-pink-100 text-pink-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {gecko.gender === "Male"
                    ? "수컷"
                    : gecko.gender === "Female"
                    ? "암컷"
                    : "미구분"}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-1">
                모프: {gecko.morph || "-"}
              </p>
              <p className="text-gray-500 text-xs mt-4">
                해칭일: {gecko.birth_date || "모름"}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {geckos.length === 0 && (
        <div className="text-center py-20">
          <p className="text-xl text-gray-500">등록된 개체가 없습니다.</p>
          <p className="text-sm text-gray-400 mt-2">
            Django Admin(localhost:8000/admin)에서 첫 번째 게코를 등록해보세요!
          </p>
        </div>
      )}
    </main>
  );
}
