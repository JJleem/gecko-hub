/* eslint-disable prefer-const */
// app/utils/morphCalculator.ts

interface Genotype {
  lilly: 0 | 1 | 2;
  sable: 0 | 1 | 2;
  cappuccino: 0 | 1 | 2;
  axanthic: 0 | 1 | 2;
  chocho: 0 | 1 | 2;
}

export const parseMorph = (name: string): Genotype => {
  const gene: Genotype = {
    lilly: 0,
    sable: 0,
    cappuccino: 0,
    axanthic: 0,
    chocho: 0,
  };

  if (name.includes("릴리") || name.includes("릴잔틱")) gene.lilly = 1;
  if (name.includes("슈퍼 세이블") || name.includes("슈퍼세이블"))
    gene.sable = 2;
  else if (name.includes("세이블")) gene.sable = 1;

  if (name.includes("프라푸치노")) gene.cappuccino = 2;
  else if (name.includes("카푸치노") || name.includes("루왁"))
    gene.cappuccino = 1;

  // 아잔틱 파싱 (비주얼 vs 66%헷 vs 100%헷 처리)
  if (name.includes("아잔틱") || name.includes("릴잔틱")) {
    if (name.includes("66%헷") || name.includes("66% 헷"))
      gene.axanthic = 0; // 계산 시엔 노멀로 간주하되 명칭만 관리
    else if (name.includes("헷아잔틱")) gene.axanthic = 1;
    else gene.axanthic = 2;
  }

  if (name.includes("초초")) {
    if (name.includes("헷초초")) gene.chocho = 1;
    else gene.chocho = 2;
  }

  return gene;
};

// 외형(Visual)만 판단하는 함수
const getVisualName = (g: Genotype): string => {
  let parts: string[] = [];
  if (g.cappuccino === 2) parts.push("프라푸치노");
  else if (g.sable === 2) parts.push("슈퍼 세이블");
  else {
    if (g.sable === 1) parts.push("세이블");
    if (g.cappuccino === 1) parts.push("카푸치노");
  }

  if (g.lilly === 1) {
    if (g.axanthic === 2) parts.push("릴잔틱");
    else parts.push("릴리화이트");
  } else {
    if (g.axanthic === 2) parts.push("아잔틱");
  }

  if (g.chocho === 2) parts.push("초초");
  if (parts.length === 0) parts.push("노멀");

  return parts.join(" ");
};

export const calculateBreeding = (sireName: string, damName: string) => {
  const sire = parseMorph(sireName);
  const dam = parseMorph(damName);

  // 1:2:1 혹은 1:1 유전 확률 계산 함수
  const getProb = (g1: number, g2: number) => {
    const probs = { 0: 0, 1: 0, 2: 0 };
    const p1 = g1 === 2 ? [1, 1] : g1 === 1 ? [0, 1] : [0, 0];
    const p2 = g2 === 2 ? [1, 1] : g2 === 1 ? [0, 1] : [0, 0];
    for (const a of p1) {
      for (const b of p2) {
        const sum = a + b;
        probs[sum as 0 | 1 | 2] += 0.25;
      }
    }
    return probs;
  };

  const lillyProb = getProb(sire.lilly, dam.lilly);
  const sableProb = getProb(sire.sable, dam.sable);
  const cappProb = getProb(sire.cappuccino, dam.cappuccino);
  const axanthicProb = getProb(sire.axanthic, dam.axanthic);
  const chochoProb = getProb(sire.chocho, dam.chocho);

  // 비주얼별로 데이터를 모으기 위한 임시 저장소
  const visualGroups: Record<
    string,
    { totalProb: number; hetAxanthicCount: number; visualAxanthicCount: number }
  > = {};

  for (let l = 0; l <= 2; l++) {
    if (lillyProb[l as 0 | 1 | 2] === 0 || l === 2) continue; // 슈퍼릴리 제외
    for (let s = 0; s <= 2; s++) {
      if (sableProb[s as 0 | 1 | 2] === 0) continue;
      for (let c = 0; c <= 2; c++) {
        if (cappProb[c as 0 | 1 | 2] === 0) continue;
        for (let a = 0; a <= 2; a++) {
          if (axanthicProb[a as 0 | 1 | 2] === 0) continue;
          for (let ch = 0; ch <= 2; ch++) {
            if (chochoProb[ch as 0 | 1 | 2] === 0) continue;

            const prob =
              lillyProb[l as 0 | 1 | 2] *
              sableProb[s as 0 | 1 | 2] *
              cappProb[c as 0 | 1 | 2] *
              axanthicProb[a as 0 | 1 | 2] *
              chochoProb[ch as 0 | 1 | 2];
            const visualName = getVisualName({
              lilly: l as 0 | 1 | 2,
              sable: s as 0 | 1 | 2,
              cappuccino: c as 0 | 1 | 2,
              axanthic: a as 0 | 1 | 2,
              chocho: ch as 0 | 1 | 2,
            });

            if (!visualGroups[visualName]) {
              visualGroups[visualName] = {
                totalProb: 0,
                hetAxanthicCount: 0,
                visualAxanthicCount: 0,
              };
            }
            visualGroups[visualName].totalProb += prob;

            // 헷 확률 계산을 위해 기록
            if (a === 1) visualGroups[visualName].hetAxanthicCount += prob;
            if (a === 2) visualGroups[visualName].visualAxanthicCount += prob;
          }
        }
      }
    }
  }

  const totalPossible = Object.values(visualGroups).reduce(
    (a, b) => a + b.totalProb,
    0
  );

  return Object.entries(visualGroups)
    .map(([name, data]) => {
      let finalName = name;
      const percentage = Math.round((data.totalProb / totalPossible) * 100);

      // 66% 헷 판별 로직 (비주얼 아잔틱이 아닌 그룹에서 헷 비율이 2/3일 때)
      if (data.visualAxanthicCount === 0 && data.hetAxanthicCount > 0) {
        const hetRatio = data.hetAxanthicCount / data.totalProb;
        if (hetRatio >= 0.99) finalName += " (100%헷아잔틱)";
        else if (Math.abs(hetRatio - 0.66) < 0.1) finalName += " (66%헷아잔틱)";
        else if (Math.abs(hetRatio - 0.5) < 0.1) finalName += " (50%헷아잔틱)";
      }

      return { name: finalName, percentage };
    })
    .sort((a, b) => b.percentage - a.percentage);
};
