// =============================================================================
// 크레스티드 게코 유전자 계산기 v2 (GeckoHub)
// =============================================================================
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ▌ 유전자 시스템 개요
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// 크레스티드 게코의 유전 가능한 주요 유전자는 4개의 좌위(Locus)로 구성됩니다.
//
// ① SCH 좌위 (Sable · Cappuccino · Highway Locus)
// ──────────────────────────────────────────────────────────────────────────
//   세이블 / 카푸치노 / 하이웨이는 동일한 유전자 좌위의 대립유전자(Allele)입니다.
//   한 개체가 "세이블이면서 독립적으로 카푸치노"가 될 수 없으며,
//   세이블/카푸치노 이형접합 조합이 "루왁(Luwak)"입니다.
//
//   유전 방식: 불완전 우성 (Incomplete Dominant)
//   대립유전자: + (노멀) · S (세이블) · C (카푸치노) · H (하이웨이)
//
//   표현형 조합표:
//     +/+  → 노멀
//     S/+  → 세이블
//     S/S  → 슈퍼 세이블
//     C/+  → 카푸치노
//     C/C  → 슈퍼 카푸치노 (멜라니스틱) ⚠️  코 기형 위험, MorphMarket 판매금지
//     H/+  → 하이웨이
//     H/H  → 슈퍼 하이웨이
//     S/C  → 루왁
//     S/H  → 세이블 하이웨이
//     C/H  → 카푸치노 하이웨이
//
// ② LW 좌위 (Lilly White Locus)
// ──────────────────────────────────────────────────────────────────────────
//   유전 방식: 불완전 우성
//   슈퍼폼(LW/LW)은 치사(Lethal)입니다.
//
//     +/+   → 노멀
//     LW/+  → 릴리화이트
//     LW/LW → 슈퍼 릴리화이트 ⚠️ 치사 (부화 실패 또는 수일 내 사망)
//
//   콤보 표현형:
//     카푸치노(C/+) + 릴리화이트(LW/+) → 프라푸치노 (Frappuccino)
//     비주얼 아잔틱 + 릴리화이트(LW/+) → 릴잔틱 (Lilzanthic)
//
// ③ Axanthic 좌위
// ──────────────────────────────────────────────────────────────────────────
//   유전 방식: 단순 열성 (Simple Recessive)
//   2카피 보유 시 비주얼 발현.
//
//     0카피 → 노멀 (유전자 없음)
//     1카피 → 헷 아잔틱 (외형 정상, 유전자 보유)
//     2카피 → 비주얼 아잔틱
//
// ④ ChoCho 좌위
// ──────────────────────────────────────────────────────────────────────────
//   유전 방식: 단순 열성
//   한국 브리더 Sunju가 2021년 최초 개발. CC/CC끼리 교배 시 배아 사망률 주의.
//
//     0카피 → 노멀
//     1카피 → 헷 초초
//     2카피 → 비주얼 초초
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ▌ 66% 헷이란?
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
//   헷×헷 교배 결과: 25% 정상 · 50% 헷 · 25% 비주얼
//   정상으로 보이는 75% 중, 1/3은 정상이고 2/3는 헷입니다.
//   따라서 외형으로 구별 불가능한 "노멀로 보이는 자식" 중
//   약 66.7%가 헷 유전자를 가질 확률이 있어 "66% 헷"이라 표현합니다.
//   본 계산기에서는 각 그룹을 정확히 분리해 표시합니다.
//
// =============================================================================

export type SCHAllele = "normal" | "sable" | "cappuccino" | "highway";
export type LWAllele = "normal" | "lw";

export interface Genotype {
  /** SCH 좌위: [대립유전자1, 대립유전자2] */
  sch: [SCHAllele, SCHAllele];
  /** LW 좌위: [대립유전자1, 대립유전자2] */
  lw: [LWAllele, LWAllele];
  /** 아잔틱 카피 수 (0=없음 · 1=헷 · 2=비주얼) */
  ax: 0 | 1 | 2;
  /** 초초 카피 수 (0=없음 · 1=헷 · 2=비주얼) */
  cc: 0 | 1 | 2;
}

export interface BreedingResult {
  /** 표현형 이름 (예: "릴잔틱 (100% 헷 초초)") */
  name: string;
  /** 확률 (0~100 정수) */
  percentage: number;
  /** 치사 여부 — 슈퍼 릴리화이트(LW/LW) */
  isLethal: boolean;
  /** 건강 경고 여부 — 슈퍼 카푸치노/멜라니스틱(C/C) */
  isHealthWarning: boolean;
  /** 경고 상세 메시지 */
  warningMessage?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 내부 유틸
// ─────────────────────────────────────────────────────────────────────────────

/** SCH 대립유전자 쌍 정규화 (순서 통일 → 중복 집계용) */
const SCH_ORDER: SCHAllele[] = ["normal", "highway", "sable", "cappuccino"];
const normSCH = (a: SCHAllele, b: SCHAllele): [SCHAllele, SCHAllele] =>
  SCH_ORDER.indexOf(a) <= SCH_ORDER.indexOf(b) ? [a, b] : [b, a];

/** LW 대립유전자 쌍 정규화 */
const normLW = (a: LWAllele, b: LWAllele): [LWAllele, LWAllele] =>
  a === "normal" ? [a, b] : [b, a];

/** SCH 좌위 교배 — 두 부모의 SCH 쌍을 받아 자손 분포 반환 */
function crossSCH(
  p1: [SCHAllele, SCHAllele],
  p2: [SCHAllele, SCHAllele]
): { pair: [SCHAllele, SCHAllele]; prob: number }[] {
  const map = new Map<string, { pair: [SCHAllele, SCHAllele]; prob: number }>();
  for (const a1 of p1) {
    for (const a2 of p2) {
      const norm = normSCH(a1, a2);
      const key = norm.join("/");
      const cur = map.get(key);
      if (cur) cur.prob += 0.25;
      else map.set(key, { pair: norm, prob: 0.25 });
    }
  }
  return Array.from(map.values());
}

/** LW 좌위 교배 */
function crossLW(
  p1: [LWAllele, LWAllele],
  p2: [LWAllele, LWAllele]
): { pair: [LWAllele, LWAllele]; prob: number }[] {
  const map = new Map<string, { pair: [LWAllele, LWAllele]; prob: number }>();
  for (const a1 of p1) {
    for (const a2 of p2) {
      const norm = normLW(a1, a2);
      const key = norm.join("/");
      const cur = map.get(key);
      if (cur) cur.prob += 0.25;
      else map.set(key, { pair: norm, prob: 0.25 });
    }
  }
  return Array.from(map.values());
}

/** 열성 유전자 교배 (ax · cc 공통) */
function crossRecessive(
  p1: 0 | 1 | 2,
  p2: 0 | 1 | 2
): { value: 0 | 1 | 2; prob: number }[] {
  // 0카피=노멀, 1카피=헷, 2카피=비주얼 → 대립유전자 배열로 변환
  const alleles = (n: 0 | 1 | 2) => (n === 2 ? [1, 1] : n === 1 ? [0, 1] : [0, 0]);
  const a1 = alleles(p1);
  const a2 = alleles(p2);
  const map: Record<number, number> = { 0: 0, 1: 0, 2: 0 };
  for (const x of a1) for (const y of a2) map[x + y] += 0.25;
  return (Object.entries(map) as [string, number][])
    .filter(([, p]) => p > 0)
    .map(([v, p]) => ({ value: Number(v) as 0 | 1 | 2, prob: p }));
}

// ─────────────────────────────────────────────────────────────────────────────
// 모프 이름 문자열 → Genotype 변환
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 모프 이름 문자열(콤마 구분 가능)을 Genotype으로 파싱합니다.
 * 예: "릴리화이트, 헷 아잔틱" → { sch: ['normal','normal'], lw: ['lw','normal'], ax: 1, cc: 0 }
 */
export const parseMorph = (nameStr: string): Genotype => {
  const joined = nameStr
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .join(" ");

  // ── SCH 좌위 ──────────────────────────────────────────────
  let sch: [SCHAllele, SCHAllele] = ["normal", "normal"];

  if (joined.includes("슈퍼 세이블") || joined.includes("슈퍼세이블")) {
    sch = ["sable", "sable"];
  } else if (
    joined.includes("슈퍼카푸치노") ||
    joined.includes("슈퍼 카푸치노") ||
    joined.includes("멜라니스틱")
  ) {
    sch = ["cappuccino", "cappuccino"];
  } else if (joined.includes("슈퍼 하이웨이") || joined.includes("슈퍼하이웨이")) {
    sch = ["highway", "highway"];
  } else if (
    joined.includes("세이블 하이웨이") ||
    joined.includes("세이블하이웨이")
  ) {
    sch = ["sable", "highway"];
  } else if (
    joined.includes("카푸치노 하이웨이") ||
    joined.includes("카푸치노하이웨이")
  ) {
    sch = ["cappuccino", "highway"];
  } else if (joined.includes("루왁")) {
    // 루왁 = Sable/Cappuccino 이형접합 (동일 좌위)
    sch = ["sable", "cappuccino"];
  } else if (joined.includes("세이블")) {
    sch = ["sable", "normal"];
  } else if (joined.includes("카푸치노") || joined.includes("프라푸치노")) {
    // 프라푸치노도 카푸치노 1카피 보유
    sch = ["cappuccino", "normal"];
  } else if (joined.includes("하이웨이")) {
    sch = ["highway", "normal"];
  }

  // ── LW 좌위 ───────────────────────────────────────────────
  // "릴리" 키워드가 있으면 LW 1카피 보유.
  // "릴리화이트", "릴리 세이블", "슈퍼세이블 릴리", "루왁 릴리",
  // "릴리100%헷아잔틱" 등 모두 포함.
  // "릴잔틱"은 "릴리" 포함 안 하므로 별도 처리.
  // "프라푸치노"는 카푸치노+릴리 콤보이므로 포함.
  let lw: [LWAllele, LWAllele] = ["normal", "normal"];
  if (
    joined.includes("릴리") ||
    joined.includes("릴잔틱") ||
    joined.includes("프라푸치노")
  ) {
    lw = ["lw", "normal"];
  }

  // ── Axanthic 좌위 ─────────────────────────────────────────
  let ax: 0 | 1 | 2 = 0;
  const hasAxWord =
    joined.includes("아잔틱") || joined.includes("릴잔틱");
  if (hasAxWord) {
    const isHet =
      joined.includes("헷아잔틱") ||
      joined.includes("헷 아잔틱") ||
      joined.includes("100%헷") ||
      joined.includes("100% 헷") ||
      joined.includes("66%헷") ||
      joined.includes("66% 헷") ||
      joined.includes("50%헷") ||
      joined.includes("50% 헷");
    // 릴잔틱은 반드시 비주얼 아잔틱을 포함
    ax = joined.includes("릴잔틱") ? 2 : isHet ? 1 : 2;
  }

  // ── ChoCho 좌위 ───────────────────────────────────────────
  let cc: 0 | 1 | 2 = 0;
  if (joined.includes("초초")) {
    const isHet =
      joined.includes("헷초초") || joined.includes("헷 초초");
    cc = isHet ? 1 : 2;
  }

  return { sch, lw, ax, cc };
};

// ─────────────────────────────────────────────────────────────────────────────
// Genotype → 표현형 정보 변환
// ─────────────────────────────────────────────────────────────────────────────

interface PhenotypeInfo {
  visual: string;
  hets: string[];
  isLethal: boolean;
  isHealthWarning: boolean;
  warningMessage?: string;
}

function getPheno(g: Genotype): PhenotypeInfo {
  const [s1, s2] = normSCH(g.sch[0], g.sch[1]);
  const lwCount = g.lw.filter((a) => a === "lw").length;

  // ── ⚠️ 치사: 슈퍼 릴리화이트 (LW/LW) ──────────────────────
  if (lwCount === 2) {
    return {
      visual: "슈퍼 릴리화이트",
      hets: [],
      isLethal: true,
      isHealthWarning: false,
      warningMessage:
        "호모 LW는 치사(Lethal) — 대부분 부화 실패 또는 수일 내 사망. LW × LW 교배는 피해야 합니다.",
    };
  }

  const hasLW = lwCount === 1;
  const isAxVisual = g.ax === 2;
  const isCcVisual = g.cc === 2;
  const isSuperCapp = s1 === "cappuccino" && s2 === "cappuccino";

  // ── ⚠️ 건강경고: 슈퍼 카푸치노 / 멜라니스틱 (C/C) ─────────
  if (isSuperCapp) {
    const extras: string[] = [];
    if (hasLW) extras.push("릴리화이트");
    if (isAxVisual) extras.push("아잔틱");
    if (isCcVisual) extras.push("초초");
    const het: string[] = [];
    if (!isAxVisual && g.ax === 1) het.push("100% 헷 아잔틱");
    if (!isCcVisual && g.cc === 1) het.push("100% 헷 초초");

    const visual = ["슈퍼 카푸치노", ...extras].join(" ");
    return {
      visual,
      hets: het,
      isLethal: false,
      isHealthWarning: true,
      warningMessage:
        "슈퍼 카푸치노(멜라니스틱)는 코 구멍 기형 위험 — MorphMarket 판매 금지 모프입니다.",
    };
  }

  // ── SCH 표현형 문자열 ──────────────────────────────────────
  const schMap: Record<string, string> = {
    "normal/normal": "",
    "normal/sable": "세이블",
    "sable/sable": "슈퍼 세이블",
    "normal/cappuccino": "카푸치노",
    "normal/highway": "하이웨이",
    "highway/highway": "슈퍼 하이웨이",
    "sable/cappuccino": "루왁",
    "sable/highway": "세이블 하이웨이",
    "cappuccino/highway": "카푸치노 하이웨이",
  };
  const schName = schMap[`${s1}/${s2}`] ?? "";

  const isCappHet =
    (s1 === "cappuccino" || s2 === "cappuccino") && !isSuperCapp;

  // ── 콤보 표현형 판별 ──────────────────────────────────────
  // 프라푸치노 = 카푸치노(C/+) + 릴리화이트(LW/+)
  // — 루왁(S/C) + LW 는 "루왁 릴리화이트"로 별도 표기
  const isFrappuccino = schName === "카푸치노" && hasLW;
  // 릴잔틱 = 비주얼 아잔틱 + 릴리화이트
  const isLilzanthic = isAxVisual && hasLW;

  const visualParts: string[] = [];

  // 프라푸치노 우선 처리
  if (isFrappuccino) {
    if (isLilzanthic) {
      // 이론상 불가 (이미 hasLW로 LW 1카피인데 릴잔틱도 hasLW를 사용) → 동일 개체
      visualParts.push("프라푸치노");
      visualParts.push("아잔틱");
    } else if (isAxVisual) {
      visualParts.push("프라푸치노 아잔틱");
    } else {
      visualParts.push("프라푸치노");
    }
  } else {
    if (schName) visualParts.push(schName);
    if (isLilzanthic) {
      visualParts.push("릴잔틱");
    } else {
      if (hasLW) visualParts.push("릴리화이트");
      if (isAxVisual) visualParts.push("아잔틱");
    }
  }

  if (isCcVisual) visualParts.push("초초");

  const visual = visualParts.join(" ") || "노멀";

  // ── 헷 마커 ──────────────────────────────────────────────
  const hets: string[] = [];
  if (g.ax === 1) hets.push("100% 헷 아잔틱");
  if (g.cc === 1) hets.push("100% 헷 초초");

  return { visual, hets, isLethal: false, isHealthWarning: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// 교배 계산기 (Public API)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 부체(sire)와 모체(dam)의 모프 이름을 받아 예상 자손 표현형 분포를 반환합니다.
 * 치사(슈퍼 LW) · 건강경고(슈퍼 카푸치노)는 별도 플래그로 구분됩니다.
 */
export const calculateBreeding = (
  sireName: string,
  damName: string
): BreedingResult[] => {
  const sire = parseMorph(sireName);
  const dam = parseMorph(damName);

  const schOffspring = crossSCH(sire.sch, dam.sch);
  const lwOffspring = crossLW(sire.lw, dam.lw);
  const axOffspring = crossRecessive(sire.ax, dam.ax);
  const ccOffspring = crossRecessive(sire.cc, dam.cc);

  // 결과 누적: key = 표현형 전체 문자열
  const map = new Map<
    string,
    Omit<BreedingResult, "name" | "percentage"> & { prob: number }
  >();

  for (const sch of schOffspring) {
    for (const lw of lwOffspring) {
      for (const ax of axOffspring) {
        for (const cc of ccOffspring) {
          const prob = sch.prob * lw.prob * ax.prob * cc.prob;
          if (prob === 0) continue;

          const pheno = getPheno({
            sch: sch.pair,
            lw: lw.pair,
            ax: ax.value,
            cc: cc.value,
          });

          const hetStr =
            pheno.hets.length > 0 ? ` (${pheno.hets.join(", ")})` : "";
          const key = `${pheno.visual}${hetStr}`;

          const cur = map.get(key);
          if (cur) {
            cur.prob += prob;
          } else {
            map.set(key, {
              prob,
              isLethal: pheno.isLethal,
              isHealthWarning: pheno.isHealthWarning,
              warningMessage: pheno.warningMessage,
            });
          }
        }
      }
    }
  }

  // 확률을 % 로 변환하고 정렬
  // 순서: 일반(확률↓) → 건강경고 → 치사
  const all: BreedingResult[] = Array.from(map.entries()).map(
    ([name, data]) => ({
      name,
      percentage: Math.round(data.prob * 100),
      isLethal: data.isLethal,
      isHealthWarning: data.isHealthWarning,
      warningMessage: data.warningMessage,
    })
  );

  const normal = all
    .filter((r) => !r.isLethal && !r.isHealthWarning)
    .sort((a, b) => b.percentage - a.percentage);
  const warnings = all
    .filter((r) => r.isHealthWarning)
    .sort((a, b) => b.percentage - a.percentage);
  const lethals = all
    .filter((r) => r.isLethal)
    .sort((a, b) => b.percentage - a.percentage);

  return [...normal, ...warnings, ...lethals];
};
