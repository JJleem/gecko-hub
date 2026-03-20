"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DeleteButton from "@/app/components/DeleteButton";
import GeckoDetailTabs from "@/app/components/GeckoDetailTabs";
import GeckoPhotoGallery from "@/app/components/GeckoPhotoGallery";

import Image from "next/image";
import Link from "next/link";
import { Gecko } from "@/app/types/gecko";
import { apiClient } from "@/lib/api";
import { useGeckoStore } from "@/app/stores/geckoStore";

import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import {
  ArrowLeft,
  CalendarDays,
  Edit,
  FileText,
  Scale,
} from "lucide-react";

export default function GeckoDetail() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { data: session, status } = useSession();
  const { geckos: cachedGeckos, updateGecko } = useGeckoStore();

  const [gecko, setGecko] = useState<Gecko | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGecko = useCallback(
    async (silent = false) => {
      if (!session?.user?.djangoToken) return;
      try {
        const res = await apiClient(session.user.djangoToken).get(
          `/api/geckos/${id}/`,
        );
        if (!res.ok) throw new Error("fetch failed");
        const data: Gecko = await res.json();
        setGecko(data);
        updateGecko(data);
      } catch (err) {
        if (!silent) console.error(err);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [session?.user?.djangoToken, id, updateGecko],
  );

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (!session?.user?.djangoToken) return;

    const numId = Number(id);
    const cached = cachedGeckos.find((g) => g.id === numId);

    if (cached) {
      // 캐시 히트: 즉시 렌더 + 백그라운드 갱신
      setGecko(cached);
      setLoading(false);
      fetchGecko(true);
    } else {
      // 캐시 미스: 로딩 후 fetch
      fetchGecko(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, id]);

  // ─── 로딩 스켈레톤 ───────────────────────────────────────
  if (loading || !gecko) {
    return (
      <main className="min-h-screen p-4 md:p-8 lg:p-10 bg-muted/10 pb-24">
        <div className="max-w-5xl mx-auto space-y-8">
          <Skeleton className="h-8 w-40" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <Skeleton className="lg:col-span-5 aspect-square rounded-[2rem]" />
            <div className="lg:col-span-7 space-y-5 pt-2">
              <Skeleton className="h-14 w-64" />
              <Skeleton className="h-5 w-48" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
              </div>
            </div>
          </div>
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </main>
    );
  }

  // ─── 상세 렌더 ──────────────────────────────────────────
  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-10 bg-muted/10 text-foreground transition-colors duration-300 pb-24">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* 상단 네비 & 액션 버튼 */}
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            asChild
            className="p-0 text-muted-foreground hover:text-primary hover:bg-transparent"
          >
            <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold">
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
              <Link href={`/geckos/${gecko.id}/edit`} className="flex items-center gap-1.5 font-bold">
                <Edit className="w-3.5 h-3.5" /> 정보 수정
              </Link>
            </Button>
            <DeleteButton id={gecko.id} />
          </div>
        </div>

        {/* 히어로: 프로필 사진 + 핵심 정보 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* 사진 + 갤러리 */}
          <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="relative aspect-square rounded-[2rem] overflow-hidden shadow-xl border-4 border-background bg-muted">
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
                <span className="text-sm font-bold tracking-widest uppercase">No Image</span>
              </div>
            )}
            {gecko.is_ovulating && (
              <div className="absolute top-4 right-4">
                {gecko.gender === "Female" ? (
                  <Badge variant="destructive" className="animate-pulse shadow-lg px-3 py-1 text-sm border-2 border-background">
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
            <GeckoPhotoGallery gecko={gecko} onRefresh={() => fetchGecko(false)} />
          </div>

          {/* 주요 정보 */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6 lg:py-4">
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
                  {gecko.gender === "Male" ? "♂ 수컷" : gecko.gender === "Female" ? "♀ 암컷" : "미구분"}
                </Badge>
              </div>
              <p className="text-xl font-bold text-primary/80">
                {gecko.morph || "모프 정보가 없습니다"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card p-4 rounded-2xl border border-border/50 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-0.5">Weight</p>
                  <p className="text-xl font-black">{gecko.weight ? `${gecko.weight}g` : "측정 전"}</p>
                </div>
              </div>
              <div className="bg-card p-4 rounded-2xl border border-border/50 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-0.5">Hatched</p>
                  <p className="text-xl font-black">{gecko.birth_date || "미상"}</p>
                </div>
              </div>
            </div>

            {(gecko.tail_loss || gecko.mbd || gecko.has_spots) && (
              <div className="flex flex-wrap gap-2">
                {gecko.tail_loss && (
                  <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-800 px-3 py-1">
                    ✂️ 꼬리 부절
                  </Badge>
                )}
                {gecko.mbd && (
                  <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800 px-3 py-1">
                    🦴 MBD 이력
                  </Badge>
                )}
                {gecko.has_spots && (
                  <Badge variant="outline" className="text-slate-700 border-slate-200 bg-slate-50/50 dark:text-slate-300 dark:border-slate-700 dark:bg-slate-800/50 px-3 py-1">
                    ⚫ 점 (Dalmatian)
                  </Badge>
                )}
              </div>
            )}

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

        {/* 탭 영역 */}
        <GeckoDetailTabs gecko={gecko} onRefresh={() => fetchGecko(false)} />

      </div>
    </main>
  );
}
