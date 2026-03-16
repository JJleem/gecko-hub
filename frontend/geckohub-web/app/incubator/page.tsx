"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Gecko, CareLog, ParentGecko } from "../types/gecko";
import {
  INCUBATION_DATA,
  calculateHatchingDate,
} from "@/app/constants/incubation";
import { calculateBreeding } from "@/app/utils/morphCalculator";
import { getDday, getImageUrl } from "../utils/client-utils";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/card";

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
  const { data: session, status } = useSession();

  const [eggs, setEggs] = useState<EggLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); // Managed by DialogTrigger

  // 🔥 [추가] 수정 중인 로그 ID 저장 (null이면 등록 모드)
  const [editingId, setEditingId] = useState<number | null>(null);

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
    if (status === "loading") return;
    if (session?.user?.djangoToken) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [session, status]);

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
      const res = await apiClient(session.user.djangoToken).get('/api/geckos/');
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

    let manualFather = false;
    let fId = "";
    let fName = "";

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
      fatherMorph: "노멀",
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
    if (!session?.user?.djangoToken) { toast.error("로그인이 필요합니다."); return; }

    try {
      const res = await apiClient(session.user.djangoToken).delete(`/api/logs/${id}/`);

      if (!res.ok) throw new Error("삭제 실패");
      toast.success("삭제되었습니다.");
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("삭제 중 오류가 발생했습니다.");
    }
  };

  // 등록 및 수정 처리
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.motherId) { toast.error("어머니 개체를 선택해주세요."); return; }
    if (!session?.user?.djangoToken) { toast.error("로그인이 필요합니다."); return; }

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
      const client = apiClient(session.user.djangoToken);
      const res = editingId
        ? await client.patch(`/api/logs/${editingId}/`, payload)
        : await client.post('/api/logs/', payload);

      if (!res.ok) throw new Error("요청 실패");

      toast.success(editingId ? "수정되었습니다! ✨" : "알이 등록되었습니다! 🥚");
      resetForm(); // 폼 초기화 및 모달 닫기
      fetchData(); // 목록 갱신
    } catch (err) {
      console.error(err);
      toast.error("오류가 발생했습니다.");
    }
  };

  if (loading)
    return <div className="p-8 text-center text-muted-foreground">🥚 로딩 중...</div>;

  return (
    <main className="flex-1 flex flex-col items-center p-4 md:p-6">
      <div className="max-w-4xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🥚 인큐베이터
          </h1>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
                className="font-bold"
              >
                + 알 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
              <DialogHeader className="bg-accent/20 p-5 border-b">
                <DialogTitle className="text-lg font-bold text-center">
                  {editingId ? "✏️ 알 정보 수정" : "🥚 새 클러치(알) 등록"}
                </DialogTitle>
                <DialogDescription className="sr-only">클러치 알을 등록하거나 수정합니다.</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="motherId" className="mb-1">
                      모 (Dam) *
                    </Label>
                    <Select
                      required
                      value={formData.motherId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, motherId: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">선택</SelectItem>
                        {females.map((f) => (
                          <SelectItem key={f.id} value={String(f.id)}>
                            {f.name} ({f.morph})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Label htmlFor="fatherId">
                        부 (Sire)
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="manualFather"
                          checked={isManualFather}
                          onCheckedChange={(checked) => {
                            setIsManualFather(checked as boolean);
                            if (checked) {
                              setFormData((prev) => ({ ...prev, fatherId: "" }));
                            } else {
                              setFormData((prev) => ({ ...prev, fatherName: "", fatherMorph: "노멀" }));
                            }
                          }}
                        />
                        <Label
                          htmlFor="manualFather"
                          className="text-xs text-muted-foreground cursor-pointer"
                        >
                          직접 입력
                        </Label>
                      </div>
                    </div>

                    {!isManualFather ? (
                      <Select
                        value={formData.fatherId}
                        onValueChange={(value) =>
                          setFormData({ ...formData, fatherId: value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="선택 안 함" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">선택 안 함</SelectItem>
                          {males.map((m) => (
                            <SelectItem key={m.id} value={String(m.id)}>
                              {m.name} ({m.morph})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="space-y-2">
                        <Input
                          type="text"
                          placeholder="외부 수컷 이름"
                          value={formData.fatherName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              fatherName: e.target.value,
                            })
                          }
                        />
                        <Input
                          type="text"
                          placeholder="수컷 모프 (유전 계산용)"
                          value={formData.fatherMorph}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              fatherMorph: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="layDate" className="mb-1">
                      산란일
                    </Label>
                    <Input
                      type="date"
                      id="layDate"
                      value={formData.layDate}
                      onChange={(e) =>
                        setFormData({ ...formData, layDate: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="eggCount" className="mb-1">
                      알 개수
                    </Label>
                    <Select
                      value={formData.eggCount}
                      onValueChange={(value) =>
                        setFormData({ ...formData, eggCount: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="2개" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1개</SelectItem>
                        <SelectItem value="2">2개</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Card className="bg-muted/50 border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-center">
                      🌡️ 인큐베이터 온도 설정
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Select
                      value={formData.temp}
                      onValueChange={(value) =>
                        setFormData({ ...formData, temp: value })
                      }
                    >
                      <SelectTrigger className="w-full font-bold">
                        <SelectValue placeholder="24.0°C (약 80일)" />
                      </SelectTrigger>
                      <SelectContent>
                        {INCUBATION_DATA.map((d) => (
                          <SelectItem key={d.temp} value={String(d.temp)}>
                            {d.temp}°C (약 {d.avg}일)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex justify-between items-center text-xs px-2 mt-2">
                      <span className="text-muted-foreground font-bold">
                        계산된 해칭일:
                      </span>
                      <span className="font-bold text-primary text-sm">
                        {formData.expectedDate}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-primary font-bold">
                      🔮 예상 모프 (유전 엔진 가동)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Textarea
                      rows={2}
                      value={formData.expectedMorph}
                      onChange={(e) =>
                        setFormData({ ...formData, expectedMorph: e.target.value })
                      }
                      placeholder="부모를 선택하면 자동으로 계산됩니다."
                      className="bg-background border-primary/20 focus-visible:ring-primary"
                    />
                  </CardContent>
                </Card>

                <div>
                  <Label htmlFor="memo" className="mb-1">
                    📝 특이사항 (Memo)
                  </Label>
                  <Textarea
                    rows={2}
                    value={formData.memo}
                    onChange={(e) =>
                      setFormData({ ...formData, memo: e.target.value })
                    }
                    placeholder="알의 상태나 특이사항을 기록하세요."
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    onClick={resetForm}
                    variant="outline"
                    className="flex-1"
                  >
                    취소
                  </Button>
                  <Button type="submit" className="flex-[2]">
                    {editingId ? "수정 완료" : "등록하기"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {eggs.map((egg) => {
            const dday = getDday(egg.expected_hatching_date);
            let ddayColorClass = "text-green-700 bg-green-100";
            let statusText = `D-${dday}`;
            if (dday < 0) {
              ddayColorClass = "text-white bg-gray-800";
              statusText = `D+${Math.abs(dday)}`;
            } else if (dday === 0) {
              ddayColorClass = "text-white bg-destructive animate-pulse";
              statusText = "오늘 해칭!";
            } else if (dday <= 7) {
              ddayColorClass = "font-bold text-orange-700 bg-orange-100";
            }

            return (
              <Card
                key={`egg-${egg.gecko}-${egg.id}`}
                className="relative overflow-hidden group"
              >
                {/* 배경 장식 */}
                <div className="absolute -right-4 -top-4 text-9xl opacity-5 select-none pointer-events-none">
                  🥚
                </div>

                {/* 수정/삭제 버튼 */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button
                    onClick={() => handleEditClick(egg)}
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100"
                    title="수정"
                  >
                    ✏️
                  </Button>
                  <Button
                    onClick={() => handleDeleteClick(egg.id)}
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-destructive border-destructive/20 bg-destructive/10 hover:bg-destructive/20"
                    title="삭제"
                  >
                    🗑️
                  </Button>
                </div>

                <CardHeader className="flex flex-row items-start justify-between pb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 bg-muted rounded-full overflow-hidden border">
                      {egg.gecko_detail.profile_image ? (
                        <Image
                          src={getImageUrl(egg.gecko_detail.profile_image)}
                          fill
                          className="object-cover"
                          alt="모체"
                          unoptimized
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-[10px] text-muted-foreground font-bold">
                          NO IMG
                        </div>
                      )}
                    </div>
                    <div>
                      <CardDescription className="text-xs font-medium">
                        모체 (Dam)
                      </CardDescription>
                      <CardTitle className="font-bold">
                        {egg.gecko_detail.name}
                      </CardTitle>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${ddayColorClass}`}
                  >
                    {statusText}
                  </span>
                </CardHeader>

                <CardContent className="grid grid-cols-2 gap-y-2 text-sm bg-muted/50 p-3 rounded-lg border border-border text-foreground">
                  <span className="text-muted-foreground">부 (Sire)</span>
                  <span className="text-right font-medium truncate">
                    {egg.partner_detail?.name || egg.partner_name || "-"}
                  </span>
                  <span className="text-muted-foreground font-medium">알 개수</span>
                  <span className="text-right font-bold text-orange-600">
                    {egg.egg_count}개 {egg.egg_count === 2 ? "🥚🥚" : "🥚"}
                  </span>
                  <span className="text-muted-foreground">관리 온도</span>
                  <span className="text-right font-medium">
                    {egg.incubation_temp}°C
                  </span>
                  <span className="text-muted-foreground">해칭 예정</span>
                  <span className="text-right font-medium text-primary ">
                    {egg.expected_hatching_date}
                  </span>
                  {egg.note && (
                    <>
                      <span className="text-muted-foreground">메모</span>
                      <span className="text-right font-medium truncate">
                        {egg.note}
                      </span>
                    </>
                  )}
                </CardContent>

                {egg.expected_morph && (
                  <CardContent className="mt-3 px-3 py-2 bg-primary/5 rounded-lg border border-primary/20">
                    <CardDescription className="text-xs text-primary font-bold block mb-1">
                      🔮 예상 모프
                    </CardDescription>
                    <p className="text-xs text-primary font-medium leading-relaxed">
                      {egg.expected_morph}
                    </p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {eggs.length === 0 && (
          <Card className="text-center py-20">
            <CardHeader>
              <CardTitle className="text-5xl mb-4">🍂</CardTitle>
              <CardDescription>
                인큐베이터가 비어있습니다.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>

      <Link
        href="/"
        className="fixed bottom-6 left-0 right-0 flex justify-center pointer-events-none"
      >
        <Button className="shadow-lg pointer-events-auto">
          🏠 홈으로
        </Button>
      </Link>
    </main>
  );
}
