"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CareLog } from "../types/gecko";

// shadcn/ui & 아이콘
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { TrendingUp, LineChart as ChartIcon } from "lucide-react";

export default function WeightChart({ logs }: { logs: CareLog[] }) {
  // 1. 데이터 가공: 'Weight' 타입만 필터링 + 날짜 오름차순 정렬 (과거 -> 현재)
  const data = logs
    .filter((log) => log.log_type === "Weight" && log.weight !== null)
    .sort(
      (a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime(),
    )
    .map((log) => ({
      date: log.log_date,
      weight: log.weight,
    }));

  // 데이터가 부족할 때 보여줄 UI (스켈레톤 느낌의 빈 상태)
  if (data.length < 2) {
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
          <p className="text-xs opacity-70">
            최소 2개 이상의 무게 기록이 필요해요
          </p>
        </CardContent>
      </Card>
    );
  }

  // 정상적인 차트 렌더링
  return (
    <Card className="h-full shadow-sm border-border/50">
      <CardHeader className="pb-6">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" /> 성장 그래프
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[280px] px-2 sm:px-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 10, bottom: 5, left: -20 }}
          >
            {/* 배경 눈금선 (테마의 border 색상 사용) */}
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--color-border)"
              opacity={0.5}
            />

            {/* X축 (날짜) */}
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              tickMargin={12}
            />

            {/* Y축 (무게) */}
            <YAxis
              unit="g"
              domain={["auto", "auto"]}
              tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              tickMargin={12}
            />

            {/* 툴팁 (다크/라이트 모드 지원 팝업) */}
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-popover)",
                borderColor: "var(--color-border)",
                borderRadius: "0.5rem",
                color: "var(--color-popover-foreground)",
                boxShadow:
                  "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
                fontWeight: 600,
                fontSize: "0.875rem",
              }}
              itemStyle={{
                color: "var(--color-primary)",
              }}
            />

            {/* 메인 꺾은선 */}
            <Line
              type="monotone"
              dataKey="weight"
              name="무게"
              stroke="var(--color-primary)" // 테마의 기본 포인트 컬러 적용
              strokeWidth={3}
              // 점 디자인
              dot={{
                r: 4,
                fill: "var(--color-background)", // 점 내부는 배경색으로 뚫어줌
                strokeWidth: 2,
                stroke: "var(--color-primary)",
              }}
              // 마우스 올렸을 때 점 디자인
              activeDot={{
                r: 6,
                fill: "var(--color-primary)",
                stroke: "var(--color-background)",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
