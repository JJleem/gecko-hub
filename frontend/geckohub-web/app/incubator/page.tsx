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
import { MoreVertical, Pencil, Trash2, Plus, Egg, Home, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
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

// ─── 인큐베이션 진행률 계산 ───────────────────────────────────
function getProgress(layDate: string, hatchDate: string): number {
  const start = new Date(layDate).getTime();
  const end = new Date(hatchDate).getTime();
  const now = Date.now();
  if (now >= end) return 100;
  if (now <= start) return 0;
  return Math.round(((now - start) / (end - start)) * 100);
}

export default function IncubatorPage() {
  const { data: session, status } = useSession();

  const [eggs, setEggs] = useState<EggLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

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
    if (session?.user?.djangoToken) fetchData();
    else setLoading(false);
  }, [session, status]);

  // 유전 계산기 자동 계산
  useEffect(() => {
    let damMorph = "노멀";
    let sireMorph = "노멀";

    if (formData.motherId) {
      const mother = females.find((f) => f.id === Number(formData.motherId));
      if (mother?.morph) damMorph = mother.morph;
    }
    if (isManualFather) {
      sireMorph = formData.fatherMorph || "노멀";
    } else if (formData.fatherId) {
      const father = males.find((m) => m.id === Number(formData.fatherId));
      if (father?.morph) sireMorph = father.morph;
    }

    if (formData.motherId && (isManualFather || formData.fatherId)) {
      const results = calculateBreeding(sireMorph, damMorph);
      if (results.length > 0) {
        const resultString = results.map((r) => `${r.name} ${r.percentage}%`).join(", ");
        setFormData((prev) => ({ ...prev, expectedMorph: resultString }));
      }
    }
  }, [formData.motherId, formData.fatherId, isManualFather, formData.fatherMorph, females, males]);

  // 해칭일 자동 계산
  useEffect(() => {
    const estimated = calculateHatchingDate(formData.layDate, parseFloat(formData.temp));
    if (estimated) setFormData((prev) => ({ ...prev, expectedDate: estimated }));
  }, [formData.layDate, formData.temp]);

  const fetchData = async () => {
    if (!session?.user?.djangoToken) return;
    try {
      const res = await apiClient(session.user.djangoToken).get("/api/geckos/");
      const geckos: Gecko[] = await res.json();

      const femaleList = geckos.filter((g) => g.gender === "Female");
      setFemales(femaleList);
      setMales(geckos.filter((g) => g.gender === "Male"));

      const allEggs: EggLog[] = femaleList.flatMap((g) =>
        g.logs
          .filter(
            (l): l is CareLog & { expected_hatching_date: string } =>
              l.log_type === "Laying" && !!l.expected_hatching_date && l.gecko === g.id
          )
          .map((l) => ({
            id: l.id,
            gecko: g.id,
            gecko_detail: { id: g.id, name: g.name, profile_image: g.profile_image },
            partner_detail: l.partner_detail,
            partner_name: l.partner_name,
            log_date: l.log_date,
            expected_hatching_date: l.expected_hatching_date,
            incubation_temp: l.incubation_temp || 0,
            egg_count: l.egg_count || 0,
            expected_morph: l.expected_morph || "",
            note: l.note || "",
          }))
      );

      const unique = Array.from(new Map(allEggs.map((e) => [e.id, e])).values());
      unique.sort(
        (a, b) =>
          new Date(a.expected_hatching_date).getTime() - new Date(b.expected_hatching_date).getTime()
      );
      setEggs(unique);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
    setEditingId(null);
    setIsFormOpen(false);
  };

  const openAddForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEditForm = (egg: EggLog) => {
    setEditingId(egg.id);
    const hasPartner = !!egg.partner_detail;
    const hasManual = !hasPartner && !!egg.partner_name;

    setFormData({
      motherId: String(egg.gecko),
      fatherId: hasPartner ? String(egg.partner_detail!.id) : "",
      fatherName: hasManual ? (egg.partner_name ?? "") : "",
      fatherMorph: "노멀",
      layDate: egg.log_date,
      eggCount: String(egg.egg_count),
      temp: String(egg.incubation_temp),
      expectedDate: egg.expected_hatching_date,
      expectedMorph: egg.expected_morph,
      memo: egg.note,
    });
    setIsManualFather(hasManual);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.motherId) { toast.error("어머니 개체를 선택해주세요."); return; }
    if (!session?.user?.djangoToken) { toast.error("로그인이 필요합니다."); return; }
    if (isSubmitting) return;

    const payload = {
      gecko: parseInt(formData.motherId),
      log_type: "Laying",
      log_date: formData.layDate,
      egg_count: parseInt(formData.eggCount),
      is_fertile: true,
      partner: isManualFather ? null : formData.fatherId ? parseInt(formData.fatherId) : null,
      partner_name: isManualFather ? formData.fatherName : "",
      incubation_temp: parseFloat(formData.temp),
      expected_hatching_date: formData.expectedDate,
      expected_morph: formData.expectedMorph,
      note: formData.memo,
    };

    setIsSubmitting(true);
    try {
      const client = apiClient(session.user.djangoToken);
      const res = editingId
        ? await client.patch(`/api/logs/${editingId}/`, payload)
        : await client.post("/api/logs/", payload);

      if (!res.ok) throw new Error("요청 실패");
      toast.success(editingId ? "수정되었습니다! ✨" : "알이 등록되었습니다! 🥚");
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId || !session?.user?.djangoToken) return;
    try {
      const res = await apiClient(session.user.djangoToken).delete(`/api/logs/${deleteTargetId}/`);
      if (!res.ok) throw new Error("삭제 실패");
      toast.success("삭제되었습니다.");
      setDeleteTargetId(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("삭제 중 오류가 발생했습니다.");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <div className="text-4xl animate-bounce">🥚</div>
          <p className="text-sm text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto py-8 px-4 space-y-6 pb-24">

        {/* 타이틀 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Egg className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">인큐베이터</h1>
              <p className="text-xs text-muted-foreground">
                {eggs.length > 0 ? `${eggs.length}개 클러치 관리 중` : "등록된 알이 없어요"}
              </p>
            </div>
          </div>
          <Button onClick={openAddForm} className="gap-2 font-semibold shadow-sm">
            <Plus className="w-4 h-4" />
            알 추가
          </Button>
        </div>

        {/* 알 목록 */}
        {eggs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border/60 rounded-2xl bg-muted/10">
            <div className="text-5xl mb-4 opacity-30">🍂</div>
            <p className="text-sm font-medium text-foreground">인큐베이터가 비어있어요</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">첫 번째 클러치를 등록해보세요</p>
            <Button onClick={openAddForm} size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> 알 추가하기
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {eggs.map((egg) => {
              const dday = getDday(egg.expected_hatching_date);
              const progress = getProgress(egg.log_date, egg.expected_hatching_date);

              let ddayLabel = `D-${dday}`;
              let ddayStyle = "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
              if (dday < 0) {
                ddayLabel = `D+${Math.abs(dday)}`;
                ddayStyle = "bg-muted text-muted-foreground";
              } else if (dday === 0) {
                ddayLabel = "오늘 해칭!";
                ddayStyle = "bg-red-500 text-white animate-pulse";
              } else if (dday <= 7) {
                ddayLabel = `D-${dday}`;
                ddayStyle = "bg-orange-500/15 text-orange-600 dark:text-orange-400 font-bold";
              }

              return (
                <Card key={egg.id} className="overflow-hidden border-border/60">
                  {/* 카드 헤더 */}
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      {/* 모체 정보 */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-11 h-11 bg-muted rounded-full overflow-hidden border border-border/60 shrink-0">
                          {egg.gecko_detail.profile_image ? (
                            <Image
                              src={getImageUrl(egg.gecko_detail.profile_image)}
                              fill
                              className="object-cover"
                              alt="모체"
                              unoptimized
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-lg">🦎</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <CardDescription className="text-[11px] font-medium mb-0.5">모체 (Dam)</CardDescription>
                          <CardTitle className="text-base leading-tight truncate">
                            {egg.gecko_detail.name}
                          </CardTitle>
                          {(egg.partner_detail?.name || egg.partner_name) && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              × {egg.partner_detail?.name || egg.partner_name}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* 우측: D-day + 메뉴 */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ddayStyle}`}>
                          {ddayLabel}
                        </span>

                        {/* 케밥 메뉴 — 항상 보임 (모바일 대응) */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem
                              onClick={() => openEditForm(egg)}
                              className="gap-2 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              수정
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteTargetId(egg.id)}
                              className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-0">
                    {/* 인큐베이션 진행률 */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>인큐베이션 진행률</span>
                        <span className="font-medium text-foreground">{progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            progress >= 100
                              ? "bg-muted-foreground"
                              : dday <= 7 && dday >= 0
                              ? "bg-orange-500"
                              : "bg-amber-500"
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-muted-foreground/70">
                        <span>{egg.log_date} 산란</span>
                        <span>{egg.expected_hatching_date} 예정</span>
                      </div>
                    </div>

                    {/* 상세 정보 그리드 */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-muted/40 rounded-xl py-2.5 px-2">
                        <p className="text-base font-bold text-amber-500">
                          {egg.egg_count === 2 ? "🥚🥚" : "🥚"}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{egg.egg_count}개</p>
                      </div>
                      <div className="bg-muted/40 rounded-xl py-2.5 px-2">
                        <p className="text-base font-bold text-foreground">{egg.incubation_temp}°C</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">관리 온도</p>
                      </div>
                      <div className="bg-muted/40 rounded-xl py-2.5 px-2">
                        <p className="text-base font-bold text-primary">
                          {dday >= 0 ? `${dday}일` : "완료"}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">남은 일수</p>
                      </div>
                    </div>

                    {/* 예상 모프 */}
                    {egg.expected_morph && (
                      <div className="rounded-xl bg-primary/5 border border-primary/20 px-3 py-2.5">
                        <p className="text-[11px] font-semibold text-primary mb-1">🔮 예상 모프</p>
                        <p className="text-xs text-primary/80 leading-relaxed line-clamp-3">
                          {egg.expected_morph}
                        </p>
                      </div>
                    )}

                    {/* 메모 */}
                    {egg.note && (
                      <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                        📝 {egg.note}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 홈 버튼 */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center pointer-events-none">
        <Link href="/" className="pointer-events-auto">
          <Button variant="outline" className="shadow-lg gap-2 bg-background">
            <Home className="w-4 h-4" />
            홈으로
          </Button>
        </Link>
      </div>

      {/* ── 등록/수정 다이얼로그 ───────────────────────────── */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="bg-muted/30 px-6 py-4 border-b border-border/50">
            <DialogTitle className="text-base font-bold">
              {editingId ? "✏️ 알 정보 수정" : "🥚 새 클러치 등록"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              산란 기록을 {editingId ? "수정" : "등록"}합니다.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* 부모 선택 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>모 (Dam) *</Label>
                <Select
                  required
                  value={formData.motherId}
                  onValueChange={(v) => setFormData({ ...formData, motherId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {females.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>
                        {f.name} ({f.morph || "모프없음"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label>부 (Sire)</Label>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                    <Checkbox
                      checked={isManualFather}
                      onCheckedChange={(c) => {
                        setIsManualFather(c as boolean);
                        if (c) setFormData((p) => ({ ...p, fatherId: "" }));
                        else setFormData((p) => ({ ...p, fatherName: "", fatherMorph: "노멀" }));
                      }}
                    />
                    직접 입력
                  </label>
                </div>
                {!isManualFather ? (
                  <Select
                    value={formData.fatherId || "none"}
                    onValueChange={(v) => setFormData({ ...formData, fatherId: v === "none" ? "" : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="선택 안 함" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">선택 안 함</SelectItem>
                      {males.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.name} ({m.morph || "모프없음"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-2">
                    <Input
                      placeholder="외부 수컷 이름"
                      value={formData.fatherName}
                      onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    />
                    <Input
                      placeholder="수컷 모프 (유전 계산용)"
                      value={formData.fatherMorph}
                      onChange={(e) => setFormData({ ...formData, fatherMorph: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 산란일 + 알 개수 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>산란일</Label>
                <Input
                  type="date"
                  value={formData.layDate}
                  onChange={(e) => setFormData({ ...formData, layDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>알 개수</Label>
                <Select
                  value={formData.eggCount}
                  onValueChange={(v) => setFormData({ ...formData, eggCount: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">🥚 1개</SelectItem>
                    <SelectItem value="2">🥚🥚 2개</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 온도 설정 */}
            <div className="space-y-2 rounded-xl bg-muted/40 border border-border/60 p-4">
              <p className="text-xs font-semibold text-muted-foreground">🌡️ 인큐베이터 온도</p>
              <Select
                value={formData.temp}
                onValueChange={(v) => setFormData({ ...formData, temp: v })}
              >
                <SelectTrigger className="font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INCUBATION_DATA.map((d) => (
                    <SelectItem key={d.temp} value={String(d.temp)}>
                      {d.temp}°C (약 {d.avg}일)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex justify-between items-center text-sm px-1">
                <span className="text-muted-foreground text-xs">계산된 해칭일</span>
                <span className="font-bold text-primary">{formData.expectedDate || "—"}</span>
              </div>
            </div>

            {/* 예상 모프 */}
            <div className="space-y-1.5 rounded-xl bg-primary/5 border border-primary/20 p-4">
              <p className="text-xs font-semibold text-primary">🔮 예상 모프 (자동 계산)</p>
              <Textarea
                rows={2}
                value={formData.expectedMorph}
                onChange={(e) => setFormData({ ...formData, expectedMorph: e.target.value })}
                placeholder="부모를 선택하면 자동으로 계산됩니다."
                className="bg-background border-primary/20 focus-visible:ring-primary text-xs"
              />
            </div>

            {/* 메모 */}
            <div className="space-y-1.5">
              <Label>📝 특이사항</Label>
              <Textarea
                rows={2}
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                placeholder="알의 상태나 특이사항을 기록하세요."
              />
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                취소
              </Button>
              <Button type="submit" className="flex-[2] font-semibold" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingId ? "수정 중..." : "등록 중..."}
                  </>
                ) : (
                  editingId ? "수정 완료" : "등록하기"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── 삭제 확인 AlertDialog ────────────────────────── */}
      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>알 기록을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              삭제된 기록은 복구할 수 없어요. 정말 삭제하시겠어요?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
