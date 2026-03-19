"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { CareLog } from "../types/gecko";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { TrendingUp, TrendingDown, Minus, LineChart as ChartIcon } from "lucide-react";

// ─── 기간 필터 ────────────────────────────────────────────
type PeriodKey = "1M" | "3M" | "6M" | "ALL";

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "1M",  label: "1개월" },
  { key: "3M",  label: "3개월" },
  { key: "6M",  label: "6개월" },
  { key: "ALL", label: "전체" },
];

function filterByPeriod(
  data: { date: string; weight: number }[],
  period: PeriodKey,
) {
  if (period === "ALL") return data;
  const months = period === "1M" ? 1 : period === "3M" ? 3 : 6;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  return data.filter((d) => new Date(d.date) >= cutoff);
}

// X축 날짜 포맷 (MM/DD)
function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function WeightChart({ logs }: { logs: CareLog[] }) {
  const [period, setPeriod] = useState<PeriodKey>("ALL");

  // 전체 데이터 (날짜 오름차순)
  const allData = useMemo(
    () =>
      logs
        .filter((l) => l.log_type === "Weight" && l.weight !== null)
        .sort((a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime())
        .map((l) => ({ date: l.log_date, weight: l.weight as number })),
    [logs],
  );

  // 기간 필터 적용
  const data = useMemo(() => filterByPeriod(allData, period), [allData, period]);

  // ─── 통계 계산 ────────────────────────────────────────
  const stats = useMemo(() => {
    if (allData.length === 0) return null;
    const first  = allData[0].weight;
    const latest = allData[allData.length - 1].weight;
    const max    = Math.max(...allData.map((d) => d.weight));
    const diff   = +(latest - first).toFixed(1);
    return { first, latest, max, diff };
  }, [allData]);

  // 데이터 부족
  if (allData.length < 2) {
    return (
      <Card className="h-full shadow-sm border-border/50 bg-muted/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> 성장 그래프
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[280px] flex flex-col items-center justify-center text-muted-foreground/60">
          <ChartIcon className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm font-medium">데이터가 부족합니다</p>
          <p className="text-xs opacity-70">최소 2개 이상의 무게 기록이 필요해요</p>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon =
    stats!.diff > 0 ? TrendingUp : stats!.diff < 0 ? TrendingDown : Minus;
  const trendColor =
    stats!.diff > 0
      ? "text-emerald-500"
      : stats!.diff < 0
      ? "text-red-500"
      : "text-muted-foreground";

  return (
    <Card className="h-full shadow-sm border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> 성장 그래프
          </CardTitle>

          {/* 기간 선택 버튼 */}
          <div className="flex gap-1">
            {PERIODS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  period === key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted border border-border/50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 통계 요약 */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="bg-muted/40 rounded-xl px-3 py-2 text-center">
              <p className="text-[11px] text-muted-foreground mb-0.5">현재 체중</p>
              <p className="text-sm font-bold text-foreground">{stats.latest}g</p>
            </div>
            <div className="bg-muted/40 rounded-xl px-3 py-2 text-center">
              <p className="text-[11px] text-muted-foreground mb-0.5">최고 체중</p>
              <p className="text-sm font-bold text-foreground">{stats.max}g</p>
            </div>
            <div className="bg-muted/40 rounded-xl px-3 py-2 text-center">
              <p className="text-[11px] text-muted-foreground mb-0.5">총 증가</p>
              <div className={`flex items-center justify-center gap-0.5 ${trendColor}`}>
                <TrendIcon className="w-3.5 h-3.5" />
                <p className="text-sm font-bold">
                  {stats.diff > 0 ? "+" : ""}{stats.diff}g
                </p>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="px-2 sm:px-6 pb-6">
        {data.length < 2 ? (
          <div className="h-[220px] flex flex-col items-center justify-center text-muted-foreground/60">
            <ChartIcon className="w-10 h-10 mb-2 opacity-20" />
            <p className="text-sm font-medium">선택 기간에 데이터가 없어요</p>
            <button
              onClick={() => setPeriod("ALL")}
              className="mt-2 text-xs text-primary hover:underline"
            >
              전체 기간 보기
            </button>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--color-border)"
                opacity={0.5}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                interval="preserveStartEnd"
              />
              <YAxis
                unit="g"
                domain={["auto", "auto"]}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-popover)",
                  borderColor: "var(--color-border)",
                  borderRadius: "0.5rem",
                  color: "var(--color-popover-foreground)",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
                itemStyle={{ color: "var(--color-primary)" }}
                labelFormatter={(label) => `📅 ${label}`}
                formatter={(value: number | undefined) => [`${value ?? "-"}g`, "체중"]}
              />
              {/* 최고 체중 기준선 */}
              {stats && (
                <ReferenceLine
                  y={stats.max}
                  stroke="var(--color-primary)"
                  strokeDasharray="4 4"
                  opacity={0.4}
                />
              )}
              <Line
                type="monotone"
                dataKey="weight"
                name="체중"
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "var(--color-background)", strokeWidth: 2, stroke: "var(--color-primary)" }}
                activeDot={{ r: 6, fill: "var(--color-primary)", stroke: "var(--color-background)", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
