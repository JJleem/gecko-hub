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

export default function WeightChart({ logs }: { logs: CareLog[] }) {
  // 1. 데이터 가공: 'Weight' 타입만 필터링 + 날짜 오름차순 정렬 (과거 -> 현재)
  const data = logs
    .filter((log) => log.log_type === "Weight" && log.weight !== null)
    .sort(
      (a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime()
    )
    .map((log) => ({
      date: log.log_date,
      weight: log.weight,
    }));

  if (data.length < 2) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed text-gray-400">
        <p>데이터가 부족합니다 (최소 2개 이상의 무게 기록 필요)</p>
      </div>
    );
  }

  return (
    <div className="w-full h-80 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold mb-4 text-gray-700">📈 성장 그래프</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
        >
          <CartesianGrid stroke="#eee" strokeDasharray="5 5" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "#888" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            unit="g"
            domain={["auto", "auto"]} // 데이터에 맞춰 Y축 범위 자동 조절
            tick={{ fontSize: 12, fill: "#888" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "none",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />
          <Line
            type="monotone" // 선을 부드럽게 곡선 처리
            dataKey="weight"
            stroke="#2563eb" // 파란색
            strokeWidth={3}
            dot={{ r: 4, fill: "#2563eb", strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
