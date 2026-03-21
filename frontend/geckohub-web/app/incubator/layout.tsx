import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "인큐베이터",
  description:
    "산란 기록과 부화 예정일을 관리하고 D-day를 실시간으로 추적하세요. 온도·예상 모프·진행률을 한 눈에.",
  openGraph: {
    title: "인큐베이터 | GeckoHub",
    description:
      "산란 기록과 부화 예정일을 관리하고 D-day를 실시간으로 추적하세요.",
    url: "https://geckohub.vercel.app/incubator",
  },
  robots: { index: false, follow: false },
};

export default function IncubatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
