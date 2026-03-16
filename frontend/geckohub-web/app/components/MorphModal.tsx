"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MORPH_LIST } from "../constants/morphs";
import { Button } from "./ui/button"; // 경로가 다를 경우 "@/components/ui/button" 등으로 수정
import { X, Dna, RotateCcw, Check } from "lucide-react";

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

      setSelected(items);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const toggleMorph = (morph: string) => {
    if (selected.includes(morph)) {
      // 이미 선택됨 -> 해제
      setSelected(selected.filter((item) => item !== morph));
    } else {
      // 선택 안됨 -> 추가 (최대 6개 제한)
      if (selected.length >= 6) {
        toast.error("최대 6개까지만 선택할 수 있어요.");
        return;
      }
      setSelected([...selected, morph]);
    }
  };

  const handleApply = () => {
    onApply(selected.join(", "));
    onClose();
  };

  // 닫혀있으면 렌더링 안 함
  if (!isOpen) return null;

  return (
    // 배경 오버레이 (블러 & 페이드 인 효과)
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {/* 모달 박스 (팝업 애니메이션) */}
      <div className="bg-card text-card-foreground w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* 헤더 영역 */}
        <div className="px-6 py-4 border-b border-border/50 bg-muted/20 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 rounded-full">
              <Dna className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">모프 선택</h2>
              <p className="text-xs text-muted-foreground font-medium">
                최대 6개까지 선택할 수 있어요{" "}
                <span className="text-primary font-bold">
                  ({selected.length}/6)
                </span>
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full w-8 h-8 text-muted-foreground hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* 모프 리스트 영역 (스크롤) */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex flex-wrap gap-2.5">
            {MORPH_LIST.map((morph) => {
              const isSelected = selected.includes(morph);
              return (
                <button
                  key={morph}
                  type="button"
                  onClick={() => toggleMorph(morph)}
                  // shadcn Badge 느낌의 커스텀 스타일 (선택/해제 시 애니메이션)
                  className={`inline-flex items-center justify-center rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:scale-105 active:scale-95
                    ${
                      isSelected
                        ? "border-transparent bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                >
                  {morph}
                </button>
              );
            })}
          </div>
        </div>

        {/* 푸터 영역 (버튼) */}
        <div className="px-6 py-4 border-t border-border/50 bg-muted/30 flex gap-3 items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setSelected([])}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-4 h-4" />
            초기화
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1 gap-2 font-bold shadow-sm"
          >
            <Check className="w-5 h-5" />
            적용하기
          </Button>
        </div>
      </div>
    </div>
  );
}
