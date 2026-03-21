"use client";

import { useState, useEffect, FormEvent } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Gecko } from "../types/gecko";
import { apiClient } from "@/lib/api";
import { useGeckoStore } from "@/app/stores/geckoStore";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";
import { Plus, X, Loader2, Heart, Egg } from "lucide-react";

export default function LogForm({
  geckoId,
  currentGender,
  onSuccess,
}: {
  geckoId: number;
  currentGender: string;
  onSuccess?: () => void;
}) {
  const { data: session } = useSession();
  const storedGeckos = useGeckoStore((s) => s.geckos);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [partners, setPartners] = useState<Gecko[]>([]);
  const [isManualPartner, setIsManualPartner] = useState(false);

  const [formData, setFormData] = useState({
    log_date: new Date().toISOString().split("T")[0],
    log_type: "Feeding",
    weight: "",
    note: "",
    egg_count: "2",
    is_fertile: true,
    egg_condition: "",
    partner: "",
    partner_name: "",
    mating_success: true,
  });

  useEffect(() => {
    if (formData.log_type !== "Mating" || partners.length > 0) return;

    const filtered = (list: Gecko[]) =>
      list.filter(
        (g) =>
          g.id !== geckoId &&
          (currentGender === "Unknown" || g.gender !== currentGender),
      );

    // 스토어에 데이터가 있으면 API 호출 없이 바로 사용
    if (storedGeckos.length > 0) {
      setPartners(filtered(storedGeckos));
      return;
    }

    // 스토어가 비어있으면 API 호출
    if (session?.user?.djangoToken) {
      apiClient(session.user.djangoToken)
        .get("/api/geckos/")
        .then((res) => res.json())
        .then((data: Gecko[]) => setPartners(filtered(data)))
        .catch((err) => console.error("파트너 로딩 실패:", err));
    }
  }, [formData.log_type, geckoId, currentGender, partners.length, session, storedGeckos]);

  const handleClose = () => {
    setIsOpen(false);
    setIsManualPartner(false);
    setFormData({
      log_date: new Date().toISOString().split("T")[0],
      log_type: "Feeding",
      weight: "",
      note: "",
      egg_count: "2",
      is_fertile: true,
      egg_condition: "",
      partner: "",
      partner_name: "",
      mating_success: true,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!session?.user?.djangoToken) {
      toast.warning("로그인 세션이 만료되었습니다.", {
        description: "다시 로그인한 후 시도해주세요.",
      });
      return;
    }

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

      const res = await apiClient(session.user.djangoToken).post(
        "/api/logs/",
        payload,
      );

      if (!res.ok) {
        const errorData = await res.json();
        toast.error("저장에 실패했습니다.", {
          description: JSON.stringify(errorData),
        });
        return;
      }

      toast.success("기록이 저장되었습니다.", {
        description: `${formData.log_date} / ${LOG_TYPE_LABELS[formData.log_type] ?? formData.log_type}`,
      });
      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error("오류가 발생했습니다.", {
        description: "잠시 후 다시 시도해주세요.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!isOpen ? (
        <Button
          variant="outline"
          className="w-full border-dashed border-2 h-11 text-muted-foreground hover:text-primary hover:border-primary transition-colors"
          onClick={() => setIsOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          기록 추가하기
        </Button>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {/* 폼 헤더 */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
            <p className="font-bold text-base">새로운 기록 남기기</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handleClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* 날짜 + 타입 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>날짜</Label>
                <Input
                  type="date"
                  value={formData.log_date}
                  onChange={(e) =>
                    setFormData({ ...formData, log_date: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>기록 종류</Label>
                <Select
                  value={formData.log_type}
                  onValueChange={(val) =>
                    setFormData({ ...formData, log_type: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Feeding">🦗 피딩</SelectItem>
                    <SelectItem value="Weight">⚖️ 체중 측정</SelectItem>
                    <SelectItem value="Mating">💞 메이팅 (Pairing)</SelectItem>
                    <SelectItem value="Laying">🥚 산란 (Laying)</SelectItem>
                    <SelectItem value="Shedding">🐍 탈피</SelectItem>
                    <SelectItem value="Cleaning">🧹 청소</SelectItem>
                    <SelectItem value="Etc">📝 기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 메이팅 전용 섹션 */}
            {formData.log_type === "Mating" && (
              <div className="rounded-lg border border-pink-500/20 bg-pink-500/5 p-4 space-y-4">
                <p className="text-xs font-bold text-pink-600 dark:text-pink-400 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5" /> 메이팅 정보
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {/* 파트너 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>파트너</Label>
                      <div className="flex items-center gap-1.5">
                        <Switch
                          id="manualPartner"
                          checked={isManualPartner}
                          onCheckedChange={(c) => {
                            setIsManualPartner(c);
                            setFormData((prev) => ({
                              ...prev,
                              partner: "",
                              partner_name: "",
                            }));
                          }}
                          className="scale-75 data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-700"
                        />
                        <Label
                          htmlFor="manualPartner"
                          className="text-xs text-muted-foreground cursor-pointer"
                        >
                          직접 입력
                        </Label>
                      </div>
                    </div>
                    {!isManualPartner ? (
                      <Select
                        value={formData.partner || "none"}
                        onValueChange={(val) =>
                          setFormData({ ...formData, partner: val === "none" ? "" : val })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="목록에서 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">선택 안 함</SelectItem>
                          {partners.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.name} ({p.gender === "Male" ? "수컷" : "암컷"})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder="이름 직접 입력"
                        value={formData.partner_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            partner_name: e.target.value,
                          })
                        }
                      />
                    )}
                  </div>
                  {/* 성공 여부 */}
                  <div className="space-y-2">
                    <Label>성공 여부</Label>
                    <Select
                      value={formData.mating_success ? "true" : "false"}
                      onValueChange={(val) =>
                        setFormData({
                          ...formData,
                          mating_success: val === "true",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">✅ 성공 (Lock)</SelectItem>
                        <SelectItem value="false">❌ 실패 / 거부</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* 산란 전용 섹션 */}
            {formData.log_type === "Laying" && (
              <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4 space-y-4">
                <p className="text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                  <Egg className="w-3.5 h-3.5" /> 산란 정보
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>알 개수</Label>
                    <Select
                      value={formData.egg_count}
                      onValueChange={(val) =>
                        setFormData({ ...formData, egg_count: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1개</SelectItem>
                        <SelectItem value="2">2개</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>유정란 여부</Label>
                    <Select
                      value={formData.is_fertile ? "true" : "false"}
                      onValueChange={(val) =>
                        setFormData({
                          ...formData,
                          is_fertile: val === "true",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">⭕ 유정란</SelectItem>
                        <SelectItem value="false">❌ 무정란</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>알 상태</Label>
                  <Input
                    placeholder="예: 예쁜 눈꽃알, 딤플 있음"
                    value={formData.egg_condition}
                    onChange={(e) =>
                      setFormData({ ...formData, egg_condition: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            {/* 공통 입력 (몸무게, 메모) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>몸무게 (g)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={formData.weight}
                  onChange={(e) =>
                    setFormData({ ...formData, weight: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>메모</Label>
                <Input
                  placeholder="특이사항 입력"
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                />
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={loading}
              >
                취소
              </Button>
              <Button type="submit" disabled={loading} className="px-6">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 저장 중...
                  </>
                ) : (
                  "저장"
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const LOG_TYPE_LABELS: Record<string, string> = {
  Feeding: "피딩",
  Weight: "체중 측정",
  Mating: "메이팅",
  Laying: "산란",
  Shedding: "탈피",
  Cleaning: "청소",
  Etc: "기타",
};
