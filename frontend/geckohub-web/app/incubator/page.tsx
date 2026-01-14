"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Gecko, CareLog, ParentGecko } from "../types/gecko";
import {
  INCUBATION_DATA,
  calculateHatchingDate,
} from "@/app/constants/incubation";
import { calculateBreeding } from "@/app/utils/morphCalculator";
import Image from "next/image";

interface EggLog {
  id: number;
  gecko: number;
  gecko_detail: ParentGecko;
  partner_detail?: ParentGecko | null;
  partner_name?: string | null;
  log_date: string;
  expected_hatching_date: string;
  incubation_temp: number;
  egg_count: number;
  expected_morph: string;
  note: string;
}

export default function IncubatorPage() {
  const { data: session } = useSession();

  const [eggs, setEggs] = useState<EggLog[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 [추가] 수정 중인 로그 ID 저장 (null이면 등록 모드)
  const [editingId, setEditingId] = useState<number | null>(null);

  const getImageUrl = (path: string | null) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const formattedPath = path.startsWith("/") ? path : `/${path}`;
    return `${process.env.NEXT_PUBLIC_API_URL}${formattedPath}`;
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [females, setFemales] = useState<Gecko[]>([]);
  const [males, setMales] = useState<Gecko[]>([]);
  const [isManualFather, setIsManualFather] = useState(false);

  const [formData, setFormData] = useState({
    motherId: "",
    fatherId: "",
    fatherName: "",
    fatherMorph: "노멀",
    layDate: new Date().toISOString().split("T")[0],
    eggCount: "2",
    temp: "24.0",
    expectedDate: "",
    expectedMorph: "",
    memo: "",
  });

  useEffect(() => {
    if (session?.user?.djangoToken) {
      fetchData();
    }
  }, [session]);

  // 유전 계산기 로직
  useEffect(() => {
    let damMorph = "노멀";
    let sireMorph = "노멀";

    if (formData.motherId) {
      const mother = females.find((f) => f.id === Number(formData.motherId));
      if (mother && mother.morph) damMorph = mother.morph;
    }

    if (isManualFather) {
      sireMorph = formData.fatherMorph || "노멀";
    } else if (formData.fatherId) {
      const father = males.find((m) => m.id === Number(formData.fatherId));
      if (father && father.morph) sireMorph = father.morph;
    }

    // 수정 모드일 때 기존에 입력된 expectedMorph가 있으면 덮어쓰지 않도록 조건 추가 가능
    // 여기서는 자동으로 다시 계산하도록 둠
    if (formData.motherId && (isManualFather || formData.fatherId)) {
      const results = calculateBreeding(sireMorph, damMorph);
      if (results.length > 0) {
        const resultString = results
          .map((r) => `${r.name} ${r.percentage}%`)
          .join(", ");
        setFormData((prev) => ({ ...prev, expectedMorph: resultString }));
      }
    }
  }, [
    formData.motherId,
    formData.fatherId,
    isManualFather,
    formData.fatherMorph,
    females,
    males,
  ]);

  const fetchData = async () => {
    if (!session?.user?.djangoToken) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/geckos/`,
        {
          headers: {
            Authorization: `Bearer ${session.user.djangoToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      const geckos: Gecko[] = await res.json();

      const females = geckos.filter((g) => g.gender === "Female");
      setFemales(females);
      setMales(geckos.filter((g) => g.gender === "Male"));

      const allEggs: EggLog[] = females.flatMap((g) => {
        const layingLogs = g.logs.filter(
          (l): l is CareLog & { expected_hatching_date: string } =>
            l.log_type === "Laying" &&
            !!l.expected_hatching_date &&
            l.gecko === g.id
        );

        return layingLogs.map((l) => ({
          id: l.id,
          gecko: g.id,
          gecko_detail: {
            id: g.id,
            name: g.name,
            profile_image: g.profile_image,
          },
          partner_detail: l.partner_detail,
          partner_name: l.partner_name,
          log_date: l.log_date,
          expected_hatching_date: l.expected_hatching_date,
          incubation_temp: l.incubation_temp || 0,
          egg_count: l.egg_count || 0,
          expected_morph: l.expected_morph || "",
          note: l.note || "",
        }));
      });

      const uniqueEggs = Array.from(
        new Map(allEggs.map((item) => [item.id, item])).values()
      );

      uniqueEggs.sort(
        (a, b) =>
          new Date(a.expected_hatching_date).getTime() -
          new Date(b.expected_hatching_date).getTime()
      );
      setEggs(uniqueEggs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 해칭일 자동 계산 (온도/날짜 변경 시)
  useEffect(() => {
    // 만약 이미 값이 있고, 사용자가 수동으로 건드리지 않았다면 계산 수행
    // (여기서는 단순화를 위해 변경 시 무조건 재계산)
    const estimated = calculateHatchingDate(
      formData.layDate,
      parseFloat(formData.temp)
    );
    if (estimated) {
      setFormData((prev) => ({ ...prev, expectedDate: estimated }));
    }
  }, [formData.layDate, formData.temp]);

  // 🔥 [추가] 폼 초기화 함수
  const resetForm = () => {
    setFormData({
      motherId: "",
      fatherId: "",
      fatherName: "",
      fatherMorph: "노멀",
      layDate: new Date().toISOString().split("T")[0],
      eggCount: "2",
      temp: "24.0",
      expectedDate: "",
      expectedMorph: "",
      memo: "",
    });
    setIsManualFather(false);
    setEditingId(null); // 수정 모드 해제
    setIsModalOpen(false);
  };

  // 🔥 [추가] 수정 버튼 클릭 핸들러
  const handleEditClick = (egg: EggLog) => {
    setEditingId(egg.id);

    // 기존 데이터 폼에 채우기
    let manualFather = false;
    let fId = "";
    let fName = "";

    // 아빠 정보 분석
    if (egg.partner_detail) {
      fId = String(egg.partner_detail.id);
      manualFather = false;
    } else if (egg.partner_name) {
      fName = egg.partner_name;
      manualFather = true;
    }

    setFormData({
      motherId: String(egg.gecko),
      fatherId: fId,
      fatherName: fName,
      fatherMorph: "노멀", // 기존 모프 정보는 별도로 저장 안 했으면 '노멀' 혹은 추후 로직 개선
      layDate: egg.log_date,
      eggCount: String(egg.egg_count),
      temp: String(egg.incubation_temp),
      expectedDate: egg.expected_hatching_date,
      expectedMorph: egg.expected_morph,
      memo: egg.note,
    });

    setIsManualFather(manualFather);
    setIsModalOpen(true);
  };

  // 🔥 [추가] 삭제 버튼 클릭 핸들러
  const handleDeleteClick = async (id: number) => {
    if (!confirm("정말 이 알 기록을 삭제하시겠습니까?")) return;
    if (!session?.user?.djangoToken) return alert("로그인이 필요합니다.");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/logs/${id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.user.djangoToken}`,
          },
        }
      );

      if (!res.ok) throw new Error("삭제 실패");
      alert("삭제되었습니다.");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // 등록 및 수정 처리
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.motherId) return alert("어머니 개체를 선택해주세요.");
    if (!session?.user?.djangoToken) return alert("로그인이 필요합니다.");

    try {
      const payload = {
        gecko: parseInt(formData.motherId),
        log_type: "Laying",
        log_date: formData.layDate,
        egg_count: parseInt(formData.eggCount),
        is_fertile: true,
        partner: isManualFather
          ? null
          : formData.fatherId
          ? parseInt(formData.fatherId)
          : null,
        partner_name: isManualFather ? formData.fatherName : "",
        incubation_temp: parseFloat(formData.temp),
        expected_hatching_date: formData.expectedDate,
        expected_morph: formData.expectedMorph,
        note: formData.memo,
      };

      // 🔥 editingId가 있으면 PATCH(수정), 없으면 POST(생성)
      const url = editingId
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/logs/${editingId}/`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/logs/`;

      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.djangoToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("요청 실패");

      alert(editingId ? "수정되었습니다! ✨" : "알이 등록되었습니다! 🥚");
      resetForm(); // 폼 초기화 및 모달 닫기
      fetchData(); // 목록 갱신
    } catch (err) {
      console.error(err);
      alert("오류가 발생했습니다.");
    }
  };

  const getDday = (targetDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    return Math.ceil(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  if (loading)
    return <div className="p-8 text-center text-gray-600">🥚 로딩 중...</div>;

  return (
    <main className="min-h-screen p-6 bg-yellow-50 pb-24 text-gray-800">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            🥚 인큐베이터
          </h1>
          <button
            onClick={() => {
              resetForm(); // 기존 데이터 비우고 열기
              setIsModalOpen(true);
            }}
            className="bg-yellow-500 text-white px-4 py-2 rounded-full font-bold shadow-md hover:bg-yellow-600 transition flex items-center gap-1 text-sm"
          >
            + 알 추가
          </button>
        </div>

        <div className="space-y-4">
          {eggs.map((egg) => {
            const dday = getDday(egg.expected_hatching_date);
            let ddayColor = "bg-green-100 text-green-700";
            let statusText = `D-${dday}`;
            if (dday < 0) {
              ddayColor = "bg-gray-800 text-white";
              statusText = `D+${Math.abs(dday)}`;
            } else if (dday === 0) {
              ddayColor = "bg-red-500 text-white animate-pulse";
              statusText = "오늘 해칭!";
            } else if (dday <= 7) {
              ddayColor = "bg-orange-100 text-orange-700 font-bold";
            }

            return (
              <div
                key={`egg-${egg.gecko}-${egg.id}`}
                className="bg-white p-5 rounded-xl shadow-sm border border-yellow-100 relative overflow-hidden group"
              >
                {/* 배경 장식 */}
                <div className="absolute -right-4 -top-4 text-9xl opacity-5 select-none pointer-events-none">
                  🥚
                </div>

                {/* 🔥 [추가] 수정/삭제 버튼 (카드 우측 상단) */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditClick(egg)}
                    className="p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200"
                    title="수정"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteClick(egg.id)}
                    className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                    title="삭제"
                  >
                    🗑️
                  </button>
                </div>

                {/* 모바일에서도 버튼이 보이게 하려면 opacity 관련 클래스 제거 후 항상 표시하거나, 별도 UI 구성 가능 */}
                {/* 여기서는 편의상 모바일에서도 보이도록 opacity 로직을 sm:hidden 처리하거나 그냥 항상 보이게 수정 */}
                <div className="absolute top-3 right-3 flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  {/* 모바일 환경 고려하여 항상 보이게 하려면 위 opacity 클래스 제거하세요 */}
                </div>

                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 bg-gray-200 rounded-full overflow-hidden border">
                      {egg.gecko_detail.profile_image ? (
                        <Image
                          src={getImageUrl(egg.gecko_detail.profile_image)}
                          fill
                          className="object-cover"
                          alt="모체"
                          unoptimized
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-[10px] text-gray-400 font-bold">
                          NO IMG
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-medium">
                        모체 (Dam)
                      </div>
                      <div className="font-bold text-gray-800">
                        {egg.gecko_detail.name}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${ddayColor}`}
                  >
                    {statusText}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-2 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100 text-gray-700">
                  <span className="text-gray-500">부 (Sire)</span>
                  <span className="text-right font-medium truncate">
                    {egg.partner_detail?.name || egg.partner_name || "-"}
                  </span>
                  <span className="text-gray-500 font-medium">알 개수</span>
                  <span className="text-right font-bold text-orange-600">
                    {egg.egg_count}개 {egg.egg_count === 2 ? "🥚🥚" : "🥚"}
                  </span>
                  <span className="text-gray-500">관리 온도</span>
                  <span className="text-right font-medium">
                    {egg.incubation_temp}°C
                  </span>
                  <span className="text-gray-500">해칭 예정</span>
                  <span className="text-right font-medium text-blue-600 font-bold">
                    {egg.expected_hatching_date}
                  </span>
                  {egg.note && (
                    <>
                      <span className="text-gray-500">메모</span>
                      <span className="text-right font-medium truncate">
                        {egg.note}
                      </span>
                    </>
                  )}
                </div>

                {egg.expected_morph && (
                  <div className="mt-3 px-3 py-2 bg-purple-50 rounded-lg border border-purple-100">
                    <span className="text-xs text-purple-400 font-bold block mb-1">
                      🔮 예상 모프
                    </span>
                    <p className="text-xs text-purple-700 font-medium leading-relaxed">
                      {egg.expected_morph}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {eggs.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🍂</div>
            <p>인큐베이터가 비어있습니다.</p>
          </div>
        )}
      </div>

      {/* 모달 (등록/수정 공용) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b bg-yellow-50">
              <h2 className="text-lg font-bold text-yellow-800 text-center">
                {editingId ? "✏️ 알 정보 수정" : "🥚 새 클러치(알) 등록"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    모 (Dam) *
                  </label>
                  <select
                    required
                    value={formData.motherId}
                    onChange={(e) =>
                      setFormData({ ...formData, motherId: e.target.value })
                    }
                    className="w-full border rounded-lg p-2 text-sm bg-red-50 focus:ring-2 focus:ring-red-200 outline-none text-gray-800"
                  >
                    <option value="">선택</option>
                    {females.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.morph})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-gray-600">
                      부 (Sire)
                    </label>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="manualFather"
                        checked={isManualFather}
                        onChange={(e) => setIsManualFather(e.target.checked)}
                        className="w-3 h-3 text-blue-600 rounded cursor-pointer"
                      />
                      <label
                        htmlFor="manualFather"
                        className="ml-1 text-[10px] text-gray-500 cursor-pointer"
                      >
                        직접 입력
                      </label>
                    </div>
                  </div>

                  {!isManualFather ? (
                    <select
                      value={formData.fatherId}
                      onChange={(e) =>
                        setFormData({ ...formData, fatherId: e.target.value })
                      }
                      className="w-full border rounded-lg p-2 text-sm bg-blue-50 focus:ring-2 focus:ring-blue-200 outline-none text-gray-800"
                    >
                      <option value="">선택 안 함</option>
                      {males.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.morph})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="외부 수컷 이름"
                        value={formData.fatherName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fatherName: e.target.value,
                          })
                        }
                        className="w-full border rounded-lg p-2 text-sm outline-none text-gray-800"
                      />
                      <input
                        type="text"
                        placeholder="수컷 모프 (유전 계산용)"
                        value={formData.fatherMorph}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fatherMorph: e.target.value,
                          })
                        }
                        className="w-full border rounded-lg p-2 text-sm bg-gray-50 outline-none text-gray-800"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    산란일
                  </label>
                  <input
                    type="date"
                    value={formData.layDate}
                    onChange={(e) =>
                      setFormData({ ...formData, layDate: e.target.value })
                    }
                    className="w-full border rounded-lg p-2 text-sm text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    알 개수
                  </label>
                  <select
                    value={formData.eggCount}
                    onChange={(e) =>
                      setFormData({ ...formData, eggCount: e.target.value })
                    }
                    className="w-full border rounded-lg p-2 text-sm text-gray-800"
                  >
                    <option value="1">1개</option>
                    <option value="2">2개</option>
                  </select>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <label className="block text-xs font-bold text-gray-600 mb-1 text-center">
                  🌡️ 인큐베이터 온도 설정
                </label>
                <select
                  value={formData.temp}
                  onChange={(e) =>
                    setFormData({ ...formData, temp: e.target.value })
                  }
                  className="w-full border rounded-lg p-2 text-sm mb-3 text-gray-800 font-bold"
                >
                  {INCUBATION_DATA.map((d) => (
                    <option key={d.temp} value={d.temp}>
                      {d.temp}°C (약 {d.avg}일)
                    </option>
                  ))}
                </select>
                <div className="flex justify-between items-center text-xs px-2">
                  <span className="text-gray-500 font-bold">
                    계산된 해칭일:
                  </span>
                  <span className="font-bold text-blue-600 text-sm">
                    {formData.expectedDate}
                  </span>
                </div>
              </div>

              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                <label className="block text-xs font-bold text-purple-700 mb-1">
                  🔮 예상 모프 (유전 엔진 가동)
                </label>
                <textarea
                  rows={2}
                  value={formData.expectedMorph}
                  onChange={(e) =>
                    setFormData({ ...formData, expectedMorph: e.target.value })
                  }
                  placeholder="부모를 선택하면 자동으로 계산됩니다."
                  className="w-full bg-white border border-purple-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-200 outline-none text-gray-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  📝 특이사항 (Memo)
                </label>
                <textarea
                  rows={2}
                  value={formData.memo}
                  onChange={(e) =>
                    setFormData({ ...formData, memo: e.target.value })
                  }
                  placeholder="알의 상태나 특이사항을 기록하세요."
                  className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-gray-200 outline-none text-gray-800"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3 bg-yellow-500 text-white rounded-xl font-bold hover:bg-yellow-600 shadow-md"
                >
                  {editingId ? "수정 완료" : "등록하기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 left-0 right-0 flex justify-center pointer-events-none">
        <Link
          href="/"
          className="bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg font-bold hover:scale-105 transition pointer-events-auto"
        >
          🏠 홈으로
        </Link>
      </div>
    </main>
  );
}
