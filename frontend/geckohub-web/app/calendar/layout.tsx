import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "사육 캘린더",
  description:
    "월별 캘린더로 피딩, 산란, 탈피, 청소 등 게코 사육 이벤트를 한눈에 확인하세요.",
  openGraph: {
    title: "사육 캘린더 | GeckoHub",
    description:
      "월별 캘린더로 피딩, 산란, 탈피, 청소 등 게코 사육 이벤트를 한눈에 확인하세요.",
    url: "https://geckohub.vercel.app/calendar",
  },
  robots: { index: false, follow: false },
};

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
