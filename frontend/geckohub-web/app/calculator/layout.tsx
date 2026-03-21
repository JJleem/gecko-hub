import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "유전자 계산기",
  description:
    "퍼넷 스퀘어 방식으로 크레스티드 게코 모프 조합 결과를 예측하세요. Lilly White, Sable, Cappuccino 등 다양한 유전자 지원.",
  keywords: [
    "크레스티드 게코 모프",
    "유전자 계산기",
    "퍼넷 스퀘어",
    "Lilly White",
    "Sable",
    "Cappuccino",
    "게코 유전자",
  ],
  openGraph: {
    title: "유전자 계산기 | GeckoHub",
    description:
      "퍼넷 스퀘어 방식으로 크레스티드 게코 모프 조합 결과를 예측하세요.",
    url: "https://geckohub.vercel.app/calculator",
  },
  robots: { index: true, follow: true },
};

export default function CalculatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
