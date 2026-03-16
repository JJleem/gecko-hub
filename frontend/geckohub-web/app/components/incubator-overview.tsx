"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Gecko, CareLog } from "../types/gecko";
import { getDday, getImageUrl } from "../utils/client-utils";
import { apiClient } from "@/lib/api";

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

export function IncubatorOverview() {
  const { data: session, status } = useSession();
  const [eggs, setEggs] = useState<EggLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (session?.user?.djangoToken) {
      fetchEggs();
    } else {
      setLoading(false);
    }
  }, [session, status]);

  const fetchEggs = async () => {
    if (!session?.user?.djangoToken) return;

    try {
      const res = await apiClient(session.user.djangoToken).get('/api/geckos/');
      const geckos: Gecko[] = await res.json();
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

      const uniqueEggs = Array.from(
        new Map(allEggs.map((item) => [item.id, item])).values(),
      );

      uniqueEggs.sort(
        (a, b) =>
          new Date(a.expected_hatching_date).getTime() -
          new Date(b.expected_hatching_date).getTime(),
      );
      setEggs(uniqueEggs);
    } catch (err) {
      console.log(err);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">로딩 중...</div>;
  }

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <h3 className="font-semibold whitespace-nowrap tracking-tight text-xl">
          🥚 인큐베이터 현황
        </h3>
        <p className="text-sm text-muted-foreground">
          현재 {eggs.length}개의 알이 케어 중입니다.
        </p>
      </div>
      <div className="p-6 pt-0 space-y-4">
        {eggs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-5xl mb-4">🍂</div>
            <p>인큐베이터가 비어있습니다.</p>
            <Link
              href="/incubator"
              className="text-primary hover:underline mt-2 inline-block"
            >
              알 추가하기
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {eggs.slice(0, 3).map((egg) => {
              const dday = getDday(egg.expected_hatching_date);
              let ddayColorClass = "text-green-700 bg-green-100";
              let statusText = `D-${dday}`;
              if (dday < 0) {
                ddayColorClass = "text-white bg-gray-800";
                statusText = `D+${Math.abs(dday)}`;
              } else if (dday === 0) {
                ddayColorClass = "text-white bg-red-500 animate-pulse";
                statusText = "오늘 해칭!";
              } else if (dday <= 7) {
                ddayColorClass = "font-bold text-orange-700 bg-orange-100";
              }

              return (
                <Link
                  href={`/incubator/${egg.id}`}
                  key={egg.id}
                  className="flex items-center space-x-3 p-3 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="relative w-10 h-10 flex-shrink-0 bg-gray-200 rounded-full overflow-hidden border">
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
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-none">
                      {egg.gecko_detail.name}의 알 ({egg.egg_count}개)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      예정: {egg.expected_hatching_date}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${ddayColorClass}`}
                  >
                    {statusText}
                  </span>
                </Link>
              );
            })}
            {eggs.length > 3 && (
              <Link
                href="/incubator"
                className="text-sm text-primary hover:underline text-center mt-4 block"
              >
                더 많은 알 보기
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
