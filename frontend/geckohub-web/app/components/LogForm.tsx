"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LogForm({ geckoId }: { geckoId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // 폼 열기/닫기 토글

  const [formData, setFormData] = useState({
    log_date: new Date().toISOString().split("T")[0], // 오늘 날짜 기본값
    log_type: "Feeding",
    weight: "",
    note: "",
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. 전송할 데이터 준비 (JSON)
      const payload = {
        gecko: geckoId, // 어떤 게코의 기록인지 ID 연결
        log_date: formData.log_date,
        log_type: formData.log_type,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        note: formData.note,
      };

      // 2. API 호출
      const res = await fetch("http://127.0.0.1:8000/api/logs/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("기록 저장 실패");

      // 3. 성공 시 처리
      alert("기록되었습니다! 📝");
      setFormData({ ...formData, weight: "", note: "" }); // 입력창 초기화
      setIsOpen(false); // 폼 닫기
      router.refresh(); // ⭐ 페이지 새로고침 없이 데이터만 갱신 (서버 컴포넌트 재요청)
    } catch (error) {
      console.error(error);
      alert("에러가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8">
      {/* 토글 버튼 */}
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
                  <option value="Shedding">👕 탈피</option>
                  <option value="Cleaning">🧹 청소</option>
                  <option value="Etc">🎸 기타</option>
                </select>
              </div>
            </div>

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
