"use client";

import { CareLog } from "../types/gecko";

// shadcn & 아이콘
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Egg, Hash, Percent, Target } from "lucide-react";

export default function EggTracker({ logs }: { logs: CareLog[] }) {
  // 1. 산란 기록만 필터링 (최신순 정렬)
  const eggLogs = logs
    .filter((log) => log.log_type === "Laying")
    .sort(
      (a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime(),
    );

  // 데이터가 없으면 렌더링 안 함
  if (eggLogs.length === 0) return null;

  // 2. 통계 계산
  const totalClutches = eggLogs.length; // 총 산란 횟수 (차수)
  const totalEggs = eggLogs.reduce((sum, log) => sum + (log.egg_count || 0), 0); // 총 알 개수
  const fertileClutches = eggLogs.filter((log) => log.is_fertile).length; // 유정란 횟수
  const fertilityRate =
    totalClutches > 0 ? Math.round((fertileClutches / totalClutches) * 100) : 0; // 확률

  return (
    <Card className="h-full shadow-sm border-border/50">
      <CardHeader className="pb-4 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Egg className="w-5 h-5 text-orange-500" /> 산란 기록
        </CardTitle>
        <span className="text-xs text-muted-foreground font-medium">
          최근 기록순
        </span>
      </CardHeader>

      <CardContent className="space-y-6 px-2 sm:px-6 pb-6 pt-0">
        {/* 📊 상단 통계 요약 카드 (Summary Grid) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 px-2 sm:px-0">
          <div className="bg-orange-500/10 border border-orange-500/20 p-3 sm:p-4 rounded-xl flex flex-col items-center justify-center">
            <Hash className="w-4 h-4 text-orange-600 dark:text-orange-400 mb-1 opacity-70" />
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mb-1">
              총 클러치
            </p>
            <p className="text-xl sm:text-2xl font-bold text-orange-700 dark:text-orange-400">
              {totalClutches}차
            </p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 sm:p-4 rounded-xl flex flex-col items-center justify-center">
            <Target className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mb-1 opacity-70" />
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mb-1">
              총 알 개수
            </p>
            <p className="text-xl sm:text-2xl font-bold text-yellow-700 dark:text-yellow-400">
              {totalEggs}개
            </p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 p-3 sm:p-4 rounded-xl flex flex-col items-center justify-center">
            <Percent className="w-4 h-4 text-blue-600 dark:text-blue-400 mb-1 opacity-70" />
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mb-1 whitespace-nowrap">
              유정 확률
            </p>
            <p className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-400">
              {fertilityRate}%
            </p>
          </div>
        </div>

        {/* 📋 산란 리스트 테이블 */}
        <div className="rounded-md border border-border/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[60px] text-center">차수</TableHead>
                <TableHead className="w-[100px] md:w-[120px]">산란일</TableHead>
                <TableHead className="text-center w-[60px]">개수</TableHead>
                <TableHead className="text-center w-[90px]">상태</TableHead>
                <TableHead className="hidden sm:table-cell">
                  컨디션 / 메모
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eggLogs.map((log, index) => {
                const clutchNumber = totalClutches - index;

                return (
                  <TableRow key={log.id} className="hover:bg-muted/30">
                    <TableCell className="text-center">
                      <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">
                        #{clutchNumber}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold text-xs md:text-sm whitespace-nowrap">
                      {log.log_date}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex w-6 h-6 items-center justify-center bg-muted rounded-full text-xs font-bold">
                        {log.egg_count}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {log.is_fertile ? (
                        <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20 shadow-none">
                          유정란
                        </Badge>
                      ) : (
                        <Badge
                          variant="destructive"
                          className="bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20 shadow-none"
                        >
                          무정란
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground truncate max-w-[200px]">
                      {log.egg_condition && (
                        <span className="font-bold text-foreground mr-1.5">
                          [{log.egg_condition}]
                        </span>
                      )}
                      {log.note || "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
