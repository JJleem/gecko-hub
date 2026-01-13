"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { Gecko, CareLog, ParentGecko } from "../types/gecko"; // 🔥 공통 타입 import
import {
  INCUBATION_DATA,
  calculateHatchingDate,
} from "@/app/constants/incubation";

// ❌ [삭제] 로컬 CareLog, GeckoWithLogs 인터페이스 삭제 (충돌 원인)

// 화면 표시용 타입 (이건 유지해도 됨)
interface EggLog {
  id: number;
  gecko: number;
  // 직접 타입을 적는 대신 ParentGecko를 재사용하면 안전합니다.
  gecko_detail: ParentGecko;
  partner_detail?: ParentGecko | null; // morph 속성 충돌 해결됨
  partner_name?: string | null;
  log_date: string;
  expected_hatching_date: string;
  incubation_temp: number;
  egg_count: number;
  expected_morph: string;
  note: string;
}

export default function IncubatorPage() {
  const [eggs, setEggs] = useState<EggLog[]>([]);
  const [loading, setLoading] = useState(true);

  // 모달 및 폼 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [females, setFemales] = useState<Gecko[]>([]);
  const [males, setMales] = useState<Gecko[]>([]);
  const [isManualFather, setIsManualFather] = useState(false);

  const [formData, setFormData] = useState({
    motherId: "",
    fatherId: "",
    fatherName: "",
    layDate: new Date().toISOString().split("T")[0],
    eggCount: "2",
    temp: "24.0",
    expectedDate: "",
    expectedMorph: "",
    memo: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/geckos/");

      const geckos: Gecko[] = await res.json();

      setFemales(geckos.filter((g) => g.gender === "Female"));
      setMales(geckos.filter((g) => g.gender === "Male"));

      // 2. 알 수집 및 변환
      const allEggs: EggLog[] = geckos.flatMap((g) => {
        // Laying 타입이면서 해칭 예정일이 있는 로그만 필터링
        // 타입 가드(Type Guard)를 사용하여 expected_hatching_date가 string임을 보장
        const layingLogs = g.logs.filter(
          (l): l is CareLog & { expected_hatching_date: string } =>
            l.log_type === "Laying" && !!l.expected_hatching_date
        );

        return layingLogs.map((l) => ({
          id: l.id,
          gecko: g.id,
          gecko_detail: {
            id: g.id,
            name: g.name,
            profile_image: g.profile_image,
          },
          partner_detail: l.partner_detail, // 이제 partner_detail 타입이 맞음
          partner_name: l.partner_name,
          log_date: l.log_date,
          expected_hatching_date: l.expected_hatching_date,
          incubation_temp: l.incubation_temp || 0,
          egg_count: l.egg_count || 0,
          expected_morph: l.expected_morph || "",
          note: l.note || "",
        }));
      });

      allEggs.sort(
        (a, b) =>
          new Date(a.expected_hatching_date).getTime() -
          new Date(b.expected_hatching_date).getTime()
      );
      setEggs(allEggs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ... (이하 나머지 코드는 동일) ...
  // 자동 계산
  useEffect(() => {
    const estimated = calculateHatchingDate(
      formData.layDate,
      parseFloat(formData.temp)
    );
    if (estimated) {
      setFormData((prev) => ({ ...prev, expectedDate: estimated }));
    }
  }, [formData.layDate, formData.temp]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.motherId) return alert("어머니 개체를 선택해주세요.");

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

      const res = await fetch("http://127.0.0.1:8000/api/logs/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("등록 실패");

      alert("알이 인큐베이터에 등록되었습니다! 🥚");
      setIsModalOpen(false);
      fetchData();

      setFormData({
        motherId: "",
        fatherId: "",
        fatherName: "",
        layDate: new Date().toISOString().split("T")[0],
        eggCount: "2",
        temp: "24.0",
        expectedDate: "",
        expectedMorph: "",
        memo: "",
      });
      setIsManualFather(false);
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
            onClick={() => setIsModalOpen(true)}
            className="bg-yellow-500 text-white px-4 py-2 rounded-full font-bold shadow-md hover:bg-yellow-600 transition flex items-center gap-1 text-sm"
          >
            + 알 추가
          </button>
        </div>

        {/* 알 리스트 */}
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
                key={egg.id}
                className="bg-white p-5 rounded-xl shadow-sm border border-yellow-100 relative overflow-hidden"
              >
                <div className="absolute -right-4 -top-4 text-9xl opacity-5 select-none pointer-events-none">
                  🥚
                </div>

                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden border">
                      {egg.gecko_detail.profile_image && (
                        <img
                          src={`http://127.0.0.1:8000${egg.gecko_detail.profile_image}`}
                          className="w-full h-full object-cover"
                          alt="모체"
                        />
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">모체 (Dam)</div>
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

                  <span className="text-gray-500">관리 온도</span>
                  <span className="text-right font-medium">
                    {egg.incubation_temp}°C
                  </span>

                  <span className="text-gray-500">해칭 예정</span>
                  <span className="text-right font-medium text-blue-600">
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
                    <p className="text-xs text-purple-700 font-medium">
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

      {/* 🟢 알 추가 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b bg-yellow-50">
              <h2 className="text-lg font-bold text-yellow-800">
                🥚 새 클러치(알) 등록
              </h2>
              <p className="text-xs text-yellow-600">
                부모 개체와 세팅 환경을 입력해주세요.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* 부모 선택 */}
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

                {/* 수컷 선택 */}
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
                    <input
                      type="text"
                      placeholder="외부 수컷 이름"
                      value={formData.fatherName}
                      onChange={(e) =>
                        setFormData({ ...formData, fatherName: e.target.value })
                      }
                      className="w-full border rounded-lg p-2 text-sm focus:border-blue-500 outline-none text-gray-800"
                    />
                  )}
                </div>
              </div>

              {/* 산란일 & 개수 */}
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

              {/* 온도 세팅 */}
              <div className="bg-gray-50 p-3 rounded-lg border">
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  인큐베이터 온도 (자동 계산)
                </label>
                <select
                  value={formData.temp}
                  onChange={(e) =>
                    setFormData({ ...formData, temp: e.target.value })
                  }
                  className="w-full border rounded-lg p-2 text-sm mb-2 text-gray-800"
                >
                  {INCUBATION_DATA.map((d) => (
                    <option key={d.temp} value={d.temp}>
                      {d.temp}°C (약 {d.avg}일)
                    </option>
                  ))}
                </select>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">예상 해칭일:</span>
                  <span className="font-bold text-blue-600">
                    {formData.expectedDate}
                  </span>
                </div>
              </div>

              {/* 예상 모프 */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  🔮 예상 모프 (Expected Morph %)
                </label>
                <input
                  type="text"
                  value={formData.expectedMorph}
                  onChange={(e) =>
                    setFormData({ ...formData, expectedMorph: e.target.value })
                  }
                  placeholder="예: 릴리 50%, 노멀 50%"
                  className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-200 outline-none text-gray-800"
                />
              </div>

              {/* 특이사항 메모 */}
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
                  placeholder="예: 알 상태 양호, 좌측 알 약간 찌그러짐"
                  className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-gray-200 outline-none text-gray-800"
                />
              </div>

              {/* 버튼 */}
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3 bg-yellow-500 text-white rounded-xl font-bold hover:bg-yellow-600 shadow-md"
                >
                  등록하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 하단 네비게이션바 */}
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
