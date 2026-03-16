"use client";

import Link from "next/link";
import { Gecko } from "@/app/types/gecko";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Activity,
  ChevronRight,
  Dna,
  FileText,
  Info,
} from "lucide-react";

import WeightChart from "@/app/components/WeightChart";
import MatingTracker from "@/app/components/MatingTracker";
import EggTracker from "@/app/components/EggTracker";
import LogForm from "@/app/components/LogForm";
import IncubationSection from "@/app/components/IncubationSection";
import LineageTree from "@/app/components/LineageTree";

export default function GeckoDetailTabs({
  gecko,
  onRefresh,
}: {
  gecko: Gecko;
  onRefresh?: () => void;
}) {
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
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6 h-11">
        <TabsTrigger value="overview" className="text-sm font-semibold">
          개요
        </TabsTrigger>
        <TabsTrigger value="records" className="text-sm font-semibold">
          성장 기록
        </TabsTrigger>
        <TabsTrigger value="lineage" className="text-sm font-semibold">
          관계도
        </TabsTrigger>
      </TabsList>

      {/* ── 탭 1: 개요 ── */}
      <TabsContent value="overview" className="space-y-6 mt-0">
        {/* 진행 중인 인큐베이팅 */}
        {activeEggs.length > 0 && <IncubationSection activeEggs={activeEggs} />}

        {/* 혈통 + 입양 2열 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="bg-muted/20 pb-3 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <Dna className="w-4 h-4 text-primary" /> 부모 혈통 (Lineage)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between items-center p-3 bg-background rounded-xl border border-border/50">
                <span className="font-extrabold text-blue-500 dark:text-blue-400 text-xs uppercase tracking-widest w-14">
                  Sire
                </span>
                {gecko.sire_detail ? (
                  <Link
                    href={`/geckos/${gecko.sire_detail.id}`}
                    className="text-foreground font-bold hover:text-primary transition-colors flex items-center gap-1"
                  >
                    {gecko.sire_detail.name}
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  </Link>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {gecko.sire_name || "알 수 없음"}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center p-3 bg-background rounded-xl border border-border/50">
                <span className="font-extrabold text-pink-500 dark:text-pink-400 text-xs uppercase tracking-widest w-14">
                  Dam
                </span>
                {gecko.dam_detail ? (
                  <Link
                    href={`/geckos/${gecko.dam_detail.id}`}
                    className="text-foreground font-bold hover:text-primary transition-colors flex items-center gap-1"
                  >
                    {gecko.dam_detail.name}
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  </Link>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {gecko.dam_name || "알 수 없음"}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50">
            <CardHeader className="bg-muted/20 pb-3 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" /> 입양 상세 (Acquisition)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between items-center p-3 bg-background rounded-xl border border-border/50">
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
              <div className="flex justify-between items-center p-3 bg-background rounded-xl border border-border/50">
                <span className="font-bold text-muted-foreground text-xs uppercase tracking-widest">
                  출처
                </span>
                <span className="font-bold text-sm">
                  {gecko.acquisition_source || "-"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 메이팅 기록 */}
        <MatingTracker logs={gecko.logs} currentGeckoId={gecko.id} />
      </TabsContent>

      {/* ── 탭 2: 성장 기록 ── */}
      <TabsContent value="records" className="space-y-6 mt-0">
        {/* 성장 차트 + 산란 기록 나란히 */}
        <div
          className={`grid gap-6 ${
            gecko.gender === "Female" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
          }`}
        >
          <WeightChart logs={gecko.logs} />
          {gecko.gender === "Female" && <EggTracker logs={gecko.logs} />}
        </div>

        {/* 사육 일지 */}
        <Card className="shadow-sm border-border/60 overflow-hidden">
          <CardHeader className="bg-background border-b border-border/50 pb-4">
            <CardTitle className="flex items-center gap-2 font-black text-xl">
              <Activity className="w-6 h-6 text-primary" /> 사육 일지 (Care Logs)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-6 bg-muted/10 border-b border-border/50">
              <LogForm geckoId={gecko.id} currentGender={gecko.gender} onSuccess={onRefresh} />
            </div>
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
                                : log.log_type === "Weight"
                                ? "⚖️ 무게"
                                : log.log_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm py-3">
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
                                <span className="text-muted-foreground/30">|</span>
                                <span className="font-bold text-foreground">
                                  {log.egg_count}개
                                </span>
                                {log.egg_condition && (
                                  <span className="text-xs text-muted-foreground ml-1">
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
                                  const externalName = isMine ? log.partner_name : "";
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
                              <span className="text-muted-foreground/30">-</span>
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
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border/60 rounded-2xl">
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
      </TabsContent>

      {/* ── 탭 3: 관계도 ── */}
      <TabsContent value="lineage" className="mt-0">
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base flex items-center gap-2">
              <Dna className="w-4 h-4 text-primary" /> 혈통 관계도 (Lineage Tree)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <LineageTree gecko={gecko} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
