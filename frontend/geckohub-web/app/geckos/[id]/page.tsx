import DeleteButton from "@/app/components/DeleteButton";
import EggTracker from "@/app/components/EggTracker";
import MatingTracker from "@/app/components/MatingTracker";
import LogForm from "@/app/components/LogForm";
import WeightChart from "@/app/components/WeightChart";
import IncubationSection from "@/app/components/IncubationSection";

import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { Gecko } from "@/app/types/gecko";

// shadcn & 아이콘
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  ArrowLeft,
  CalendarDays,
  Dna,
  Edit,
  Activity,
  FileText,
  Scale,
  ChevronRight,
  Info,
} from "lucide-react";

// 데이터 가져오기 (SSR)
async function getGeckoDetail(id: string): Promise<Gecko> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/geckos/${id}/`,
    {
      cache: "no-store",
      headers: {
        Cookie: cookieHeader,
        "Content-Type": "application/json",
      },
    },
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch gecko details (Status: ${res.status})`);
  }

  return res.json();
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function GeckoDetail({ params }: Props) {
  const { id } = await params;
  const gecko = await getGeckoDetail(id);

  // 진행 중인 인큐베이팅 알 필터링
  const activeEggs = gecko.logs
    .filter(
      (l) =>
        l.log_type === "Laying" &&
        l.expected_hatching_date &&
        new Date(l.expected_hatching_date) >=
          new Date(new Date().setHours(0, 0, 0, 0)),
    )
    .sort(
      (a, b) =>
        new Date(a.expected_hatching_date!).getTime() -
        new Date(b.expected_hatching_date!).getTime(),
    );

  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-10 bg-muted/10 text-foreground transition-colors duration-300 pb-24">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* 상단 네비게이션 & 액션 버튼 */}
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            asChild
            className="p-0 text-muted-foreground hover:text-primary hover:bg-transparent"
          >
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-semibold"
            >
              <ArrowLeft className="w-4 h-4" /> 목록으로 돌아가기
            </Link>
          </Button>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground shadow-sm transition-all"
            >
              <Link
                href={`/geckos/${gecko.id}/edit`}
                className="flex items-center gap-1.5 font-bold"
              >
                <Edit className="w-3.5 h-3.5" /> 정보 수정
              </Link>
            </Button>
            <DeleteButton id={gecko.id} />
          </div>
        </div>

        {/* 인큐베이터 요약 (활성화된 알이 있을 때만 렌더링) */}
        {activeEggs.length > 0 && (
          <div className="mb-6">
            <IncubationSection activeEggs={activeEggs} />
          </div>
        )}

        {/* 1. 상단 프로필 하이라이트 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* 사진 영역 (정사각형 고정, 둥근 모서리 강조) */}
          <div className="lg:col-span-5 relative aspect-square rounded-[2rem] overflow-hidden shadow-xl border-4 border-background bg-muted">
            {gecko.profile_image ? (
              <Image
                src={gecko.profile_image}
                alt={gecko.name}
                fill
                className="object-cover hover:scale-105 transition-transform duration-700"
                unoptimized
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground/30 bg-muted/50">
                <span className="text-7xl mb-4 drop-shadow-sm">🦎</span>
                <span className="text-sm font-bold tracking-widest uppercase">
                  No Image
                </span>
              </div>
            )}

            {/* 이미지 오버레이 뱃지 (배란/발정) */}
            {gecko.is_ovulating && (
              <div className="absolute top-4 right-4">
                {gecko.gender === "Female" ? (
                  <Badge
                    variant="destructive"
                    className="animate-pulse shadow-lg px-3 py-1 text-sm border-2 border-background"
                  >
                    🥚 배란중 (Ovulating)
                  </Badge>
                ) : (
                  <Badge className="bg-blue-500 hover:bg-blue-600 shadow-lg px-3 py-1 text-sm border-2 border-background text-white">
                    🔥 발정기 (Rut)
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* 주요 정보 영역 */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6 lg:py-4">
            {/* 이름 및 성별 */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
                  {gecko.name}
                </h1>
                <Badge
                  variant={
                    gecko.gender === "Male"
                      ? "default"
                      : gecko.gender === "Female"
                        ? "destructive"
                        : "secondary"
                  }
                  className="px-2.5 py-1 text-sm shadow-sm"
                >
                  {gecko.gender === "Male"
                    ? "♂ 수컷"
                    : gecko.gender === "Female"
                      ? "♀ 암컷"
                      : "미구분"}
                </Badge>
              </div>
              <p className="text-xl font-bold text-primary/80">
                {gecko.morph || "모프 정보가 없습니다"}
              </p>
            </div>

            {/* 핵심 스펙 카드 (몸무게 / 해칭일) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card p-4 rounded-2xl border border-border/50 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-0.5">
                    Weight
                  </p>
                  <p className="text-xl font-black">
                    {gecko.weight ? `${gecko.weight}g` : "측정 전"}
                  </p>
                </div>
              </div>
              <div className="bg-card p-4 rounded-2xl border border-border/50 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-0.5">
                    Hatched
                  </p>
                  <p className="text-xl font-black">
                    {gecko.birth_date || "미상"}
                  </p>
                </div>
              </div>
            </div>

            {/* 특징 및 건강 상태 뱃지 모음 */}
            <div className="flex flex-wrap gap-2">
              {gecko.tail_loss && (
                <Badge
                  variant="outline"
                  className="text-orange-600 border-orange-200 bg-orange-50/50 px-3 py-1"
                >
                  ✂️ 꼬리 부절
                </Badge>
              )}
              {gecko.mbd && (
                <Badge
                  variant="outline"
                  className="text-red-600 border-red-200 bg-red-50/50 px-3 py-1"
                >
                  🦴 MBD 이력
                </Badge>
              )}
              {gecko.has_spots && (
                <Badge
                  variant="outline"
                  className="text-slate-700 border-slate-200 bg-slate-50/50 dark:text-slate-300 dark:border-slate-700 dark:bg-slate-800/50 px-3 py-1"
                >
                  ⚫ 점 (Dalmatian)
                </Badge>
              )}
            </div>

            {/* 특이사항 메모 */}
            {gecko.description && (
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <p className="font-bold text-primary flex items-center gap-1.5 mb-1.5 text-sm">
                  <FileText className="w-4 h-4" /> 특이사항 메모
                </p>
                <p className="text-foreground/80 leading-relaxed text-sm whitespace-pre-wrap">
                  {gecko.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 2. 세부 정보 카드 (혈통 & 입양) - 2단 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 혈통 정보 카드 */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="bg-muted/20 pb-3 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <Dna className="w-4 h-4 text-primary" /> 부모 혈통 (Lineage)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Sire */}
              <div className="flex justify-between items-center p-3 bg-background rounded-xl border border-border/50 shadow-sm">
                <span className="font-extrabold text-blue-600/80 dark:text-blue-400 text-xs uppercase tracking-widest w-16">
                  Sire
                </span>
                {gecko.sire_detail ? (
                  <Link
                    href={`/geckos/${gecko.sire_detail.id}`}
                    className="text-foreground font-bold hover:text-primary transition-colors flex items-center gap-1"
                  >
                    {gecko.sire_detail.name}{" "}
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  </Link>
                ) : (
                  <span className="font-medium text-muted-foreground text-sm">
                    {gecko.sire_name || "알 수 없음"}
                  </span>
                )}
              </div>
              {/* Dam */}
              <div className="flex justify-between items-center p-3 bg-background rounded-xl border border-border/50 shadow-sm">
                <span className="font-extrabold text-pink-600/80 dark:text-pink-400 text-xs uppercase tracking-widest w-16">
                  Dam
                </span>
                {gecko.dam_detail ? (
                  <Link
                    href={`/geckos/${gecko.dam_detail.id}`}
                    className="text-foreground font-bold hover:text-primary transition-colors flex items-center gap-1"
                  >
                    {gecko.dam_detail.name}{" "}
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  </Link>
                ) : (
                  <span className="font-medium text-muted-foreground text-sm">
                    {gecko.dam_name || "알 수 없음"}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 입양 정보 카드 */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="bg-muted/20 pb-3 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" /> 입양 상세
                (Acquisition)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex justify-between items-center p-3 bg-background rounded-xl border border-border/50 shadow-sm">
                <span className="font-bold text-muted-foreground text-xs uppercase tracking-widest">
                  구분
                </span>
                <span className="font-bold text-sm">
                  {gecko.acquisition_type === "Hatched"
                    ? "🐣 직접 해칭"
                    : gecko.acquisition_type === "Rescue"
                      ? "🚑 구조/기타"
                      : "🏠 입양 (분양)"}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-background rounded-xl border border-border/50 shadow-sm">
                <span className="font-bold text-muted-foreground text-xs uppercase tracking-widest">
                  출처
                </span>
                <span className="font-bold text-sm text-foreground">
                  {gecko.acquisition_source || "-"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3. 트래커 및 차트 영역 (넓은 단일 컬럼으로 배치하여 깨짐 방지) */}
        <div className="space-y-6">
          <WeightChart logs={gecko.logs} />
          <MatingTracker logs={gecko.logs} currentGeckoId={gecko.id} />
          {gecko.gender === "Female" && <EggTracker logs={gecko.logs} />}
        </div>

        {/* 4. 사육 일지 (Logs) - 폼과 테이블 완벽 통합 */}
        <Card className="shadow-lg border-border/60 overflow-hidden">
          <CardHeader className="bg-background border-b border-border/50 pb-4">
            <CardTitle className="flex items-center gap-2 font-black text-xl">
              <Activity className="w-6 h-6 text-primary" /> 사육 일지 (Care
              Logs)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* 일지 입력 폼 (LogForm 컴포넌트 내부에서 처리됨) */}
            <div className="p-6 bg-muted/10 border-b border-border/50">
              <LogForm geckoId={gecko.id} currentGender={gecko.gender} />
            </div>

            {/* 일지 목록 테이블 */}
            <div className="p-6 bg-background">
              {gecko.logs && gecko.logs.length > 0 ? (
                <div className="rounded-xl border border-border/50 overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[120px] font-bold text-muted-foreground">
                          날짜
                        </TableHead>
                        <TableHead className="w-[100px] font-bold text-muted-foreground">
                          분류
                        </TableHead>
                        <TableHead className="font-bold text-muted-foreground">
                          내용 요약
                        </TableHead>
                        <TableHead className="hidden md:table-cell font-bold text-muted-foreground">
                          메모
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gecko.logs.map((log) => (
                        <TableRow
                          key={log.id}
                          className="hover:bg-muted/20 transition-colors"
                        >
                          <TableCell className="font-semibold text-sm whitespace-nowrap text-foreground">
                            {log.log_date}
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`shadow-sm border-none ${
                                log.log_type === "Feeding"
                                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                  : log.log_type === "Weight"
                                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                    : log.log_type === "Laying"
                                      ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                                      : log.log_type === "Mating"
                                        ? "bg-pink-500/10 text-pink-600 dark:text-pink-400"
                                        : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {log.log_type === "Laying"
                                ? "🥚 산란"
                                : log.log_type === "Mating"
                                  ? "💞 메이팅"
                                  : log.log_type === "Feeding"
                                    ? "🦗 피딩"
                                    : "⚖️ 무게"}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-sm py-3">
                            {/* 타입별 내용 렌더링 로직 */}
                            {log.log_type === "Weight" && log.weight ? (
                              <span className="font-bold text-base text-foreground">
                                {log.weight}g
                              </span>
                            ) : log.log_type === "Laying" ? (
                              <div className="flex items-center gap-2">
                                <span
                                  className={
                                    log.is_fertile
                                      ? "text-blue-600 dark:text-blue-400 font-bold"
                                      : "text-red-500 dark:text-red-400 font-bold"
                                  }
                                >
                                  {log.is_fertile ? "유정란" : "무정란"}
                                </span>
                                <span className="text-muted-foreground/30">
                                  |
                                </span>
                                <span className="font-bold text-foreground">
                                  {log.egg_count}개
                                </span>
                                {log.egg_condition && (
                                  <span className="text-xs text-muted-foreground font-medium ml-1">
                                    ({log.egg_condition})
                                  </span>
                                )}
                              </div>
                            ) : log.log_type === "Mating" ? (
                              <div className="flex items-center gap-2 font-medium">
                                <span>{log.mating_success ? "✅" : "❌"}</span>
                                {(() => {
                                  const isMine = log.gecko === gecko.id;
                                  const other = isMine
                                    ? log.partner_detail
                                    : log.gecko_detail;
                                  const externalName = isMine
                                    ? log.partner_name
                                    : "";

                                  if (other) {
                                    return (
                                      <Link
                                        href={`/geckos/${other.id}`}
                                        className="text-primary hover:underline font-bold"
                                      >
                                        with {other.name}
                                      </Link>
                                    );
                                  } else if (externalName) {
                                    return (
                                      <span className="text-foreground">
                                        with {externalName} (외부)
                                      </span>
                                    );
                                  } else {
                                    return (
                                      <span className="text-muted-foreground">
                                        파트너 없음
                                      </span>
                                    );
                                  }
                                })()}
                              </div>
                            ) : (
                              <span className="text-muted-foreground/30">
                                -
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-[200px] truncate">
                            {log.note || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 bg-background border-2 border-dashed border-border/60 rounded-2xl">
                  <FileText className="w-12 h-12 text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">
                    등록된 사육 일지가 없습니다.
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    위의 폼에서 새로운 기록을 추가해보세요.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
