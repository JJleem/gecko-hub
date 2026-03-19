"use client";

import { useState } from "react";
import {
  Dna,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Mars,
  Venus,
  AlertTriangle,
  Skull,
  Info,
  ChevronRight,
} from "lucide-react";
import { Button } from "../components/ui/button";
import MorphModal from "../components/MorphModal";
import { calculateBreeding, type BreedingResult } from "../utils/morphCalculator";
import { GENETIC_MORPH_LIST } from "../constants/morphs";

// ─────────────────────────────────────────────────────────────────────────────
// 모프 색상 테마 (실제 모프 색감 기반)
// ─────────────────────────────────────────────────────────────────────────────
interface MorphTheme {
  card: string;
  bar: string;
  border: string;
}

function getMorphTheme(name: string): MorphTheme {
  // 릴잔틱 — 은빛 + 흰색
  if (name.includes("릴잔틱"))
    return {
      card: "bg-gradient-to-r from-slate-300/10 to-zinc-200/10",
      bar: "bg-gradient-to-r from-slate-300 to-zinc-200",
      border: "border-slate-300/40",
    };
  // 프라푸치노 — 따뜻한 아이보리
  if (name.includes("프라푸치노"))
    return {
      card: "bg-gradient-to-r from-amber-100/10 to-orange-100/10",
      bar: "bg-gradient-to-r from-amber-200 to-orange-200",
      border: "border-amber-200/40",
    };
  // 릴리화이트 — 밝은 실버/화이트
  if (name.includes("릴리화이트"))
    return {
      card: "bg-gradient-to-r from-slate-100/10 to-white/5",
      bar: "bg-gradient-to-r from-slate-200 to-white",
      border: "border-slate-200/50",
    };
  // 아잔틱 — 차가운 회색
  if (name.includes("아잔틱"))
    return {
      card: "bg-gradient-to-r from-slate-500/10 to-zinc-500/10",
      bar: "bg-gradient-to-r from-slate-400 to-zinc-400",
      border: "border-slate-400/40",
    };
  // 초초 — 선명한 붉은/주황
  if (name.includes("초초"))
    return {
      card: "bg-gradient-to-r from-rose-500/10 to-red-500/10",
      bar: "bg-gradient-to-r from-rose-400 to-red-400",
      border: "border-rose-400/40",
    };
  // 루왁 — 진한 다크 브라운 (세이블+카푸치노)
  if (name.includes("루왁"))
    return {
      card: "bg-gradient-to-r from-stone-700/15 to-amber-900/10",
      bar: "bg-gradient-to-r from-stone-600 to-amber-900",
      border: "border-stone-500/40",
    };
  // 슈퍼 세이블 — 딥 차콜
  if (name.includes("슈퍼 세이블") || name.includes("슈퍼세이블"))
    return {
      card: "bg-gradient-to-r from-zinc-700/20 to-stone-700/15",
      bar: "bg-gradient-to-r from-zinc-600 to-stone-600",
      border: "border-zinc-500/40",
    };
  // 세이블 — 다크 스톤
  if (name.includes("세이블"))
    return {
      card: "bg-gradient-to-r from-stone-600/15 to-zinc-600/10",
      bar: "bg-gradient-to-r from-stone-500 to-zinc-500",
      border: "border-stone-400/40",
    };
  // 카푸치노 — 따뜻한 커피 브라운
  if (name.includes("카푸치노"))
    return {
      card: "bg-gradient-to-r from-amber-800/15 to-amber-700/10",
      bar: "bg-gradient-to-r from-amber-700 to-amber-600",
      border: "border-amber-600/40",
    };
  // 하이웨이 — 골든 옐로우
  if (name.includes("하이웨이"))
    return {
      card: "bg-gradient-to-r from-yellow-500/10 to-amber-400/10",
      bar: "bg-gradient-to-r from-yellow-400 to-amber-400",
      border: "border-yellow-400/40",
    };
  // 헷 계열 — 해당 모프 연한 버전 (기본 muted)
  if (name.includes("헷"))
    return {
      card: "bg-muted/20",
      bar: "bg-muted-foreground/40",
      border: "border-border",
    };
  // 노멀 — 중성 톤
  return {
    card: "bg-muted/20",
    bar: "bg-muted-foreground/50",
    border: "border-border",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 결과 카드
// ─────────────────────────────────────────────────────────────────────────────
function ResultCard({ result }: { result: BreedingResult }) {
  // 치사
  if (result.isLethal) {
    return (
      <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Skull className="w-4 h-4 text-red-400 shrink-0" />
            <span className="font-semibold text-sm text-red-400 truncate">
              {result.name}
            </span>
          </div>
          <span className="text-base font-bold tabular-nums text-red-400 shrink-0">
            {result.percentage}%
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-red-900/40 overflow-hidden mb-2">
          <div
            className="h-full rounded-full bg-red-500"
            style={{ width: `${result.percentage}%` }}
          />
        </div>
        {result.warningMessage && (
          <p className="text-xs text-red-400/80 mt-1">{result.warningMessage}</p>
        )}
      </div>
    );
  }

  // 건강 경고
  if (result.isHealthWarning) {
    return (
      <div className="rounded-xl border border-orange-400/50 bg-orange-500/10 p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
            <span className="font-semibold text-sm text-orange-300 truncate">
              {result.name}
            </span>
          </div>
          <span className="text-base font-bold tabular-nums text-orange-300 shrink-0">
            {result.percentage}%
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-orange-900/40 overflow-hidden mb-2">
          <div
            className="h-full rounded-full bg-orange-500"
            style={{ width: `${result.percentage}%` }}
          />
        </div>
        {result.warningMessage && (
          <p className="text-xs text-orange-400/80 mt-1">{result.warningMessage}</p>
        )}
      </div>
    );
  }

  // 일반
  const theme = getMorphTheme(result.name);

  return (
    <div className={`rounded-xl border p-4 transition-all duration-200 ${theme.card} ${theme.border}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm truncate flex-1 min-w-0">
          {result.name}
        </span>
        <span className="text-base font-bold tabular-nums ml-3 shrink-0">
          {result.percentage}%
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-border/40 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${theme.bar}`}
          style={{ width: `${result.percentage}%` }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 유전자 시스템 설명 아코디언
// ─────────────────────────────────────────────────────────────────────────────
const GENE_INFO = [
  {
    title: "SCH 좌위 — 세이블 · 카푸치노 · 하이웨이",
    icon: "🧬",
    content: [
      "세이블, 카푸치노, 하이웨이는 서로 독립된 유전자가 아닌, 동일한 유전자 좌위(Locus)의 대립유전자(Allele)입니다.",
      "따라서 한 개체가 '세이블이면서 독립 카푸치노'가 될 수 없고, 대신 세이블/카푸치노 이형접합이 루왁(Luwak)으로 발현됩니다.",
      "유전 방식은 불완전 우성(Incomplete Dominant)으로, 1카피 보유 시 외형에 표현됩니다.",
      "슈퍼 카푸치노(C/C = 멜라니스틱)는 코 구멍 기형 등 건강 문제가 보고되어 MorphMarket에서 판매가 금지된 모프입니다.",
    ],
    warning: "슈퍼 카푸치노(멜라니스틱)는 건강 문제로 교배 시 주의가 필요합니다.",
  },
  {
    title: "LW 좌위 — 릴리화이트",
    icon: "🤍",
    content: [
      "릴리화이트는 불완전 우성으로, 1카피(LW/+)에서 릴리화이트 외형이 발현됩니다.",
      "호모폼(LW/LW = 슈퍼 릴리화이트)은 치사(Lethal)로, 대부분 부화에 실패하거나 수일 내 사망합니다. 릴리화이트 × 릴리화이트 교배는 피해야 합니다.",
      "프라푸치노(Frappuccino)는 카푸치노(C/+)와 릴리화이트(LW/+)의 콤보 표현형입니다. 슈퍼 카푸치노(C/C)가 아닙니다.",
      "릴잔틱(Lilzanthic)은 비주얼 아잔틱과 릴리화이트의 콤보 표현형입니다.",
    ],
    warning: "슈퍼 릴리화이트는 치사입니다. LW × LW 교배는 반드시 피해야 합니다.",
  },
  {
    title: "Axanthic — 아잔틱",
    icon: "🩶",
    content: [
      "단순 열성(Simple Recessive) 유전자입니다. 비주얼 발현을 위해 2카피가 필요합니다.",
      "1카피 보유 개체(헷 아잔틱)는 외형이 정상으로 보이지만 유전자를 전달합니다.",
      "헷 × 헷 교배 시 자손의 25%가 비주얼 아잔틱, 50%가 헷, 25%가 정상입니다.",
      "정상으로 보이는 자손 중 2/3(약 66%)가 헷 유전자를 보유할 확률이 있어 '66% 헷'이라 표현합니다.",
    ],
  },
  {
    title: "ChoCho — 초초",
    icon: "🦎",
    content: [
      "단순 열성 유전자로, 한국 브리더 Sunju가 2021년 최초 개발한 모프입니다.",
      "2카피 보유 시 비주얼 초초가 발현됩니다.",
      "비주얼 초초(CC/CC)끼리 교배 시 배아 사망률이 높아 근교(inbreeding) 취약성이 있습니다.",
      "비주얼 초초는 노멀 또는 릴리화이트와 교배하는 것이 권장됩니다.",
    ],
    warning: "비주얼 초초 × 비주얼 초초 교배는 배아 사망률이 높습니다.",
  },
];

function GeneInfoSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3">
        <Info className="w-4 h-4" />
        유전자 시스템 안내
      </div>
      {GENE_INFO.map((item, i) => (
        <div
          key={i}
          className="rounded-xl border border-border overflow-hidden"
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span>{item.icon}</span>
              <span className="text-sm font-medium">{item.title}</span>
            </div>
            <ChevronRight
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                open === i ? "rotate-90" : ""
              }`}
            />
          </button>
          {open === i && (
            <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3 bg-muted/20">
              <ul className="space-y-2">
                {item.content.map((line, j) => (
                  <li key={j} className="flex gap-2 text-xs text-muted-foreground">
                    <span className="mt-0.5 shrink-0 text-primary">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              {item.warning && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-400/30 px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-400">{item.warning}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 메인 페이지
// ─────────────────────────────────────────────────────────────────────────────
export default function CalculatorPage() {
  const [sireMorph, setSireMorph] = useState("");
  const [damMorph, setDamMorph] = useState("");
  const [sireModalOpen, setSireModalOpen] = useState(false);
  const [damModalOpen, setDamModalOpen] = useState(false);

  const results: BreedingResult[] =
    sireMorph && damMorph ? calculateBreeding(sireMorph, damMorph) : [];

  const normalResults = results.filter((r) => !r.isLethal && !r.isHealthWarning);
  const warningResults = results.filter((r) => r.isHealthWarning || r.isLethal);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto py-8 px-4 space-y-6">

        {/* 타이틀 */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-2">
            <Dna className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">유전자 계산기</h1>
          <p className="text-sm text-muted-foreground">
            부모 모프를 선택하면 자손의 예상 모프와 확률을 계산해드려요
          </p>
        </div>

        {/* 부모 선택 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 부체 */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-blue-500">
              <Mars className="w-4 h-4" />
              부체 (수컷)
            </div>
            <button
              onClick={() => setSireModalOpen(true)}
              className="w-full min-h-[80px] rounded-xl border-2 border-dashed border-blue-400/40 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-400/70 transition-all duration-200 p-4 text-left group"
            >
              {sireMorph ? (
                <div className="space-y-1">
                  <div className="flex flex-wrap gap-1.5">
                    {sireMorph.split(", ").map((m) => (
                      <span
                        key={m}
                        className="inline-flex items-center rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-400 border border-blue-400/30"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">클릭하여 수정</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-1 text-muted-foreground group-hover:text-blue-400 transition-colors">
                  <ChevronDown className="w-5 h-5" />
                  <span className="text-xs font-medium">모프 선택</span>
                </div>
              )}
            </button>
          </div>

          {/* 모체 */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-pink-500">
              <Venus className="w-4 h-4" />
              모체 (암컷)
            </div>
            <button
              onClick={() => setDamModalOpen(true)}
              className="w-full min-h-[80px] rounded-xl border-2 border-dashed border-pink-400/40 bg-pink-500/5 hover:bg-pink-500/10 hover:border-pink-400/70 transition-all duration-200 p-4 text-left group"
            >
              {damMorph ? (
                <div className="space-y-1">
                  <div className="flex flex-wrap gap-1.5">
                    {damMorph.split(", ").map((m) => (
                      <span
                        key={m}
                        className="inline-flex items-center rounded-full bg-pink-500/20 px-2.5 py-0.5 text-xs font-medium text-pink-400 border border-pink-400/30"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">클릭하여 수정</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-1 text-muted-foreground group-hover:text-pink-400 transition-colors">
                  <ChevronDown className="w-5 h-5" />
                  <span className="text-xs font-medium">모프 선택</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* 초기화 */}
        {(sireMorph || damMorph) && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSireMorph(""); setDamMorph(""); }}
              className="gap-2 text-muted-foreground text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              초기화
            </Button>
          </div>
        )}

        {/* 빈 상태 */}
        {!sireMorph && !damMorph && (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 py-14 text-center space-y-2">
            <Sparkles className="w-8 h-8 mx-auto text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              부모 모프를 선택하면
              <br />
              예상 자손 확률이 표시돼요
            </p>
          </div>
        )}

        {/* 결과 */}
        {sireMorph && damMorph && results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">
                예상 자손 모프
                <span className="ml-2 text-muted-foreground font-normal">
                  ({results.length}종)
                </span>
              </h2>
            </div>

            {/* 일반 결과 */}
            {normalResults.length > 0 && (
              <div className="space-y-2">
                {normalResults.map((r, i) => (
                  <ResultCard key={i} result={r} />
                ))}
              </div>
            )}

            {/* 경고/치사 구분선 */}
            {warningResults.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 pt-1">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    주의 필요
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                {warningResults.map((r, i) => (
                  <ResultCard key={i} result={r} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 유전자 시스템 설명 */}
        <div className="pt-2 border-t border-border/50">
          <GeneInfoSection />
        </div>
      </div>

      {/* 모달 */}
      <MorphModal
        isOpen={sireModalOpen}
        onClose={() => setSireModalOpen(false)}
        onApply={(val) => setSireMorph(val)}
        initialSelected={sireMorph}
        morphList={GENETIC_MORPH_LIST}
      />
      <MorphModal
        isOpen={damModalOpen}
        onClose={() => setDamModalOpen(false)}
        onApply={(val) => setDamMorph(val)}
        initialSelected={damMorph}
        morphList={GENETIC_MORPH_LIST}
      />
    </div>
  );
}
