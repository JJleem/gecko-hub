import Image from "next/image";
import { Gecko } from "./types/gecko";
import Link from "next/link";

// 백엔드 데이터 가져오는 함수
async function getGeckos(): Promise<Gecko[]> {
  const res = await fetch("http://127.0.0.1:8000/api/geckos/", {
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Failed to fetch geckos");
    return [];
  }

  return res.json();
}

export default async function Home() {
  const geckos = await getGeckos();

  return (
    <main className="min-h-screen p-8 bg-gray-100 text-black">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">🦎 GeckoHub</h1>
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

              {/* 🔥 [추가] 이미지 위에 띄우는 배란/발정 뱃지 (눈에 더 잘 띔) */}
              {gecko.is_ovulating && (
                <div className="absolute top-2 right-2 z-10">
                  {gecko.gender === "Female" ? (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md animate-pulse">
                      🥚 배란중
                    </span>
                  ) : gecko.gender === "Male" ? (
                    <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                      🔥 발정옴
                    </span>
                  ) : null}
                </div>
              )}
            </div>

            <div className="p-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold truncate pr-2">
                  {gecko.name}
                </h2>

                {/* 성별 뱃지 */}
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold shrink-0
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
            새 개체 등록 버튼을 눌러보세요!
          </p>
        </div>
      )}
    </main>
  );
}
