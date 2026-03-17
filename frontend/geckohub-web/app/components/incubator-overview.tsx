"use client";

import Link from "next/link";
import Image from "next/image";
import { Gecko, CareLog } from "../types/gecko";
import { getDday, getImageUrl } from "../utils/client-utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

interface EggLog {
  id: number;
  gecko: number;
  gecko_detail: { id: number; name: string; profile_image: string | null };
  partner_detail?: { id: number; name: string } | null;
  partner_name?: string | null;
  log_date: string;
  expected_hatching_date: string;
  incubation_temp: number;
  egg_count: number;
  expected_morph: string;
  note: string;
}

interface IncubatorOverviewProps {
  geckos: Gecko[];
}

export function IncubatorOverview({ geckos }: IncubatorOverviewProps) {
  const females = geckos.filter((g) => g.gender === "Female");

  const allEggs: EggLog[] = females.flatMap((g) => {
    const layingLogs = g.logs.filter(
      (l): l is CareLog & { expected_hatching_date: string } =>
        l.log_type === "Laying" &&
        !!l.expected_hatching_date &&
        l.gecko === g.id,
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

  const eggs = Array.from(
    new Map(allEggs.map((item) => [item.id, item])).values(),
  ).sort(
    (a, b) =>
      new Date(a.expected_hatching_date).getTime() -
      new Date(b.expected_hatching_date).getTime(),
  );

  return (
    <Card className="h-full flex flex-col shadow-sm border-border/60 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          🥚 인큐베이터 현황
        </CardTitle>
        <CardDescription>
          현재 {eggs.length}개의 알이 케어 중입니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {eggs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground py-4">
            <div className="text-4xl mb-3 opacity-40">🍂</div>
            <p className="text-sm">인큐베이터가 비어있습니다.</p>
            <Link
              href="/incubator"
              className="text-primary hover:underline mt-2 text-sm inline-block"
            >
              알 추가하기
            </Link>
          </div>
        ) : (
          <div className="space-y-1">
            {eggs.slice(0, 3).map((egg) => {
              const dday = getDday(egg.expected_hatching_date);
              let ddayColorClass =
                "text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/40";
              let statusText = `D-${dday}`;
              if (dday < 0) {
                ddayColorClass = "text-white bg-gray-700";
                statusText = `D+${Math.abs(dday)}`;
              } else if (dday === 0) {
                ddayColorClass = "text-white bg-red-500 animate-pulse";
                statusText = "오늘 해칭!";
              } else if (dday <= 7) {
                ddayColorClass =
                  "font-bold text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/40";
              }

              return (
                <Link
                  href={`/incubator`}
                  key={egg.id}
                  className="flex items-center space-x-3 p-3 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="relative w-10 h-10 flex-shrink-0 bg-muted rounded-full overflow-hidden border border-border">
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
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none truncate">
                      {egg.gecko_detail.name}의 알 ({egg.egg_count}개)
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      예정: {egg.expected_hatching_date}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${ddayColorClass}`}
                  >
                    {statusText}
                  </span>
                </Link>
              );
            })}
            {eggs.length > 3 && (
              <Link
                href="/incubator"
                className="text-sm text-primary hover:underline text-center mt-2 block py-1"
              >
                +{eggs.length - 3}개 더 보기
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
