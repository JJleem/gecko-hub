"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Gecko } from "../types/gecko";
import { useSession } from "next-auth/react";
import { apiClient } from "@/lib/api";

export default function LogForm({
  geckoId,
  currentGender,
}: {
  geckoId: number;
  currentGender: string;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [partners, setPartners] = useState<Gecko[]>([]);

  // [추가] 직접 입력 모드인지 여부
  const [isManualPartner, setIsManualPartner] = useState(false);

  const [formData, setFormData] = useState({
    log_date: new Date().toISOString().split("T")[0],
    log_type: "Feeding",
    weight: "",
    note: "",
    egg_count: "2",
    is_fertile: true,
    egg_condition: "",
    partner: "", // ID 저장용
    partner_name: "", // [추가] 이름 직접 입력용
    mating_success: true,
  });

  // 메이팅 선택 시 파트너 목록 로딩
  useEffect(() => {
    if (
      formData.log_type === "Mating" &&
      partners.length === 0 &&
      session?.user?.djangoToken
    ) {
      apiClient(session.user.djangoToken).get('/api/geckos/')
        .then((res) => res.json())
        .then((data: Gecko[]) => {
          const candidates = data.filter(
            (g) =>
              g.id !== geckoId &&
              (currentGender === "Unknown" || g.gender !== currentGender)
          );
          setPartners(candidates);
        })
        .catch((err) => console.error("파트너 로딩 실패:", err));
    }
  }, [
    formData.log_type,
    geckoId,
    currentGender,
    partners.length,
    session, // 의존성 추가
  ]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        gecko: geckoId,
        log_date: formData.log_date,
        log_type: formData.log_type,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        note: formData.note,
        egg_count:
          formData.log_type === "Laying" ? parseInt(formData.egg_count) : null,
        is_fertile:
          formData.log_type === "Laying" ? formData.is_fertile : false,
        egg_condition:
          formData.log_type === "Laying" ? formData.egg_condition : "",
        partner:
          formData.log_type === "Mating" && !isManualPartner && formData.partner
            ? parseInt(formData.partner)
            : null,
        partner_name:
          formData.log_type === "Mating" && isManualPartner
            ? formData.partner_name
            : "",

        mating_success:
          formData.log_type === "Mating" ? formData.mating_success : false,
      };
      const res = await apiClient(session!.user.djangoToken).post('/api/logs/', payload);

      if (!res.ok) {
        const errorData = await res.json();
        console.log("서버 에러:", errorData);
        alert(`저장 실패: ${JSON.stringify(errorData)}`);
        throw new Error("API 요청 실패");
      }

      alert("기록되었습니다! 📝");
      // 초기화
      setFormData({
        ...formData,
        weight: "",
        note: "",
        partner: "",
        partner_name: "",
      });
      setIsManualPartner(false);
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("에러가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 transition font-medium"
        >
          + 기록 추가하기 (피딩, 무게 등)
        </button>
      ) : (
        <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm">
          <h3 className="font-bold text-lg mb-4">새로운 기록 남기기</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">날짜</label>
                <input
                  type="date"
                  value={formData.log_date}
                  onChange={(e) =>
                    setFormData({ ...formData, log_date: e.target.value })
                  }
                  className="w-full border rounded p-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">타입</label>
                <select
                  value={formData.log_type}
                  onChange={(e) =>
                    setFormData({ ...formData, log_type: e.target.value })
                  }
                  className="w-full border rounded p-2 text-sm"
                >
                  <option value="Feeding">🦗 피딩</option>
                  <option value="Weight">⚖️ 체중 측정</option>
                  <option value="Mating">💞 메이팅 (Pairing)</option>
                  <option value="Laying">🥚 산란 (Laying)</option>
                  <option value="Shedding">👕 탈피</option>
                  <option value="Cleaning">🧹 청소</option>
                  <option value="Etc">🎸 기타</option>
                </select>
              </div>
            </div>

            {/* 메이팅 폼 */}
            {formData.log_type === "Mating" && (
              <div className="bg-pink-50 p-3 rounded-lg border border-pink-100 space-y-3">
                <p className="text-xs font-bold text-pink-600">
                  💞 메이팅 정보 입력
                </p>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs text-gray-500">
                        파트너
                      </label>
                      {/* 직접 입력 토글 체크박스 */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="manualPartner"
                          checked={isManualPartner}
                          onChange={(e) => setIsManualPartner(e.target.checked)}
                          className="w-3 h-3 rounded text-pink-600 focus:ring-pink-500"
                        />
                        <label
                          htmlFor="manualPartner"
                          className="ml-1 text-[10px] text-gray-500 cursor-pointer"
                        >
                          직접 입력
                        </label>
                      </div>
                    </div>

                    {/* 모드에 따라 SelectBox 또는 Input 보여주기 */}
                    {!isManualPartner ? (
                      <select
                        value={formData.partner}
                        onChange={(e) =>
                          setFormData({ ...formData, partner: e.target.value })
                        }
                        className="w-full border rounded p-2 text-sm"
                      >
                        <option value="">목록에서 선택</option>
                        {partners.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.gender})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="이름 직접 입력"
                        value={formData.partner_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            partner_name: e.target.value,
                          })
                        }
                        className="w-full border rounded p-2 text-sm"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">
                      성공 여부
                    </label>
                    <select
                      value={formData.mating_success ? "true" : "false"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mating_success: e.target.value === "true",
                        })
                      }
                      className="w-full border rounded p-2 text-sm"
                    >
                      <option value="true">✅ 성공 (Lock)</option>
                      <option value="false">❌ 실패 (거부/Fail)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 산란 폼 */}
            {formData.log_type === "Laying" && (
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 space-y-3">
                <p className="text-xs font-bold text-orange-600">
                  🥚 산란 정보 입력
                </p>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">
                      개수
                    </label>
                    <select
                      value={formData.egg_count}
                      onChange={(e) =>
                        setFormData({ ...formData, egg_count: e.target.value })
                      }
                      className="w-full border rounded p-2 text-sm"
                    >
                      <option value="1">1개</option>
                      <option value="2">2개</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">
                      유정란 여부
                    </label>
                    <select
                      value={formData.is_fertile ? "true" : "false"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_fertile: e.target.value === "true",
                        })
                      }
                      className="w-full border rounded p-2 text-sm"
                    >
                      <option value="true">⭕ 유정란</option>
                      <option value="false">❌ 무정란</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    알 상태 (눈꽃, 찌그러짐 등)
                  </label>
                  <input
                    type="text"
                    value={formData.egg_condition}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        egg_condition: e.target.value,
                      })
                    }
                    placeholder="예: 예쁜 눈꽃알, 딤플 있음"
                    className="w-full border rounded p-2 text-sm"
                  />
                </div>
              </div>
            )}

            {/* 공통 입력 (몸무게, 메모) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  몸무게 (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={formData.weight}
                  onChange={(e) =>
                    setFormData({ ...formData, weight: e.target.value })
                  }
                  className="w-full border rounded p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">메모</label>
                <input
                  type="text"
                  placeholder="특이사항 입력"
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                  className="w-full border rounded p-2 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "저장 중..." : "저장"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
