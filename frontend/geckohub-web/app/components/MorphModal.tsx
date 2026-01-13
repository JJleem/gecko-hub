"use client";

import { useState, useEffect } from "react";
import { MORPH_LIST } from "../constants/morphs";

interface MorphModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (selected: string) => void;
  initialSelected: string; // "릴리화이트, 아잔틱" 형태의 문자열
}

export default function MorphModal({
  isOpen,
  onClose,
  onApply,
  initialSelected,
}: MorphModalProps) {
  const [selected, setSelected] = useState<string[]>([]);

  // 모달 열릴 때 초기값 세팅
  useEffect(() => {
    if (isOpen) {
      const items = initialSelected
        ? initialSelected
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      // 현재 상태와 다를 때만 업데이트 (무한 루프 방지)
      setSelected(items);
    }
    // initialSelected가 바뀌더라도 모달이 열려있는 동안에는
    // 사용자가 선택한 값이 유지되어야 하므로 dependency에서 뺐습니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const toggleMorph = (morph: string) => {
    if (selected.includes(morph)) {
      // 이미 선택됨 -> 해제
      setSelected(selected.filter((item) => item !== morph));
    } else {
      // 선택 안됨 -> 추가 (최대 6개 제한)
      if (selected.length >= 6) {
        alert("최대 6개까지만 선택할 수 있어요.");
        return;
      }
      setSelected([...selected, morph]);
    }
  };

  const handleApply = () => {
    // 배열을 "릴리화이트, 아잔틱" 형태의 문자열로 합쳐서 부모에게 전달
    onApply(selected.join(", "));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold">모프 선택</h2>
            <p className="text-xs text-gray-500">
              최대 6개까지 선택할 수 있어요
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            &times;
          </button>
        </div>

        {/* 모프 리스트 (스크롤 영역) */}
        <div className="p-4 overflow-y-auto flex-1">
          <div className="flex flex-wrap gap-2">
            {MORPH_LIST.map((morph) => {
              const isSelected = selected.includes(morph);
              return (
                <button
                  key={morph}
                  type="button"
                  onClick={() => toggleMorph(morph)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all
                    ${
                      isSelected
                        ? "bg-blue-500 text-white border-blue-500 font-bold shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  {morph}
                </button>
              );
            })}
          </div>
        </div>

        {/* 푸터 (버튼) */}
        <div className="p-4 border-t bg-gray-50 flex space-x-2">
          <button
            onClick={() => setSelected([])}
            className="flex-1 py-3 rounded-xl bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 transition"
          >
            초기화
          </button>
          <button
            onClick={handleApply}
            className="flex-[2] py-3 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600 transition shadow-md"
          >
            적용하기 ({selected.length})
          </button>
        </div>
      </div>
    </div>
  );
}
