import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "내 게코",
  description: "등록된 크레스티드 게코 목록을 확인하고 새 개체를 등록하세요.",
  openGraph: {
    title: "내 게코 | GeckoHub",
    description: "등록된 크레스티드 게코 목록을 확인하고 새 개체를 등록하세요.",
    url: "https://geckohub.vercel.app/geckos",
  },
  robots: { index: false, follow: false },
};

export default function GeckosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
