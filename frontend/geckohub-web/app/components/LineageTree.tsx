"use client";

import Image from "next/image";
import Link from "next/link";
import { Gecko, ParentGecko } from "@/app/types/gecko";
import { ExternalLink } from "lucide-react";

function getImageUrl(path: string | null): string {
  if (!path) return "";
  return path.startsWith("http") ? path : `https://gecko-hub.vercel.app${path}`;
}

function GeckoNode({
  gecko,
  externalName,
  label,
  labelColor,
  isCurrent = false,
}: {
  gecko?: ParentGecko | null;
  externalName?: string | null;
  label: string;
  labelColor: string;
  isCurrent?: boolean;
}) {
  const name = gecko?.name || externalName || "알 수 없음";
  const imageUrl = gecko?.profile_image ? getImageUrl(gecko.profile_image) : null;
  const isLink = !!(gecko?.id && !isCurrent);

  const card = (
    <div
      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 bg-card shadow-sm w-36 transition-all duration-200 ${
        isCurrent
          ? "border-primary shadow-md shadow-primary/10"
          : isLink
          ? "border-border/60 hover:border-primary/50 hover:shadow-md"
          : "border-border/40"
      }`}
    >
      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-muted border border-border/40 flex-shrink-0">
        {imageUrl ? (
          <Image src={imageUrl} fill className="object-cover" alt={name} unoptimized />
        ) : (
          <div className="flex items-center justify-center h-full text-3xl opacity-40">
            🦎
          </div>
        )}
      </div>
      <div className="text-center w-full">
        <p
          className={`text-sm font-bold leading-tight truncate ${
            isLink ? "group-hover:text-primary transition-colors" : ""
          }`}
        >
          {name}
        </p>
        {gecko?.morph && (
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
            {gecko.morph}
          </p>
        )}
        {isCurrent && (
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1 inline-block">
            현재
          </span>
        )}
        {!gecko && externalName && (
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full mt-1 inline-block">
            외부
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-2">
      <span className={`text-[11px] font-black uppercase tracking-widest ${labelColor}`}>
        {label}
      </span>
      {isLink ? (
        <Link href={`/geckos/${gecko!.id}`} className="group">
          {card}
        </Link>
      ) : (
        card
      )}
      {isLink && gecko?.id && (
        <Link
          href={`/geckos/${gecko.id}`}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
        >
          <ExternalLink className="w-3 h-3" /> 페이지로
        </Link>
      )}
    </div>
  );
}

export default function LineageTree({ gecko }: { gecko: Gecko }) {
  const hasSire = gecko.sire_detail || gecko.sire_name;
  const hasDam = gecko.dam_detail || gecko.dam_name;
  const hasParents = hasSire || hasDam;

  return (
    <div className="flex flex-col items-center py-8">
      {hasParents ? (
        <>
          {/* 부모 행 */}
          <div className="flex items-end justify-center gap-12 sm:gap-20">
            {hasSire ? (
              <GeckoNode
                gecko={gecko.sire_detail}
                externalName={gecko.sire_name}
                label="Sire (부)"
                labelColor="text-blue-500 dark:text-blue-400"
              />
            ) : (
              <div className="w-36" />
            )}
            {hasDam ? (
              <GeckoNode
                gecko={gecko.dam_detail}
                externalName={gecko.dam_name}
                label="Dam (모)"
                labelColor="text-pink-500 dark:text-pink-400"
              />
            ) : (
              <div className="w-36" />
            )}
          </div>

          {/* 연결선: 역 V자 */}
          <div className="flex w-[160px] sm:w-[200px] h-8 mt-2">
            <div className="w-1/2 border-b-2 border-r-2 border-border/50 rounded-br-xl" />
            <div className="w-1/2 border-b-2 border-l-2 border-border/50 rounded-bl-xl" />
          </div>

          {/* 수직선 */}
          <div className="w-0.5 h-5 bg-border/50" />
        </>
      ) : null}

      {/* 현재 게코 */}
      <GeckoNode
        gecko={{
          id: gecko.id,
          name: gecko.name,
          profile_image: gecko.profile_image,
          morph: gecko.morph,
        }}
        label="본인"
        labelColor="text-primary"
        isCurrent
      />

      {!hasParents && (
        <div className="mt-8 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            등록된 부모 혈통 정보가 없습니다.
          </p>
          <Link
            href={`/geckos/${gecko.id}/edit`}
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            <ExternalLink className="w-3.5 h-3.5" /> 정보 수정에서 혈통을
            등록해보세요
          </Link>
        </div>
      )}

      <p className="text-xs text-muted-foreground/50 mt-10 text-center">
        조부모 및 자손 관계도는 추후 업데이트 예정입니다.
      </p>
    </div>
  );
}
