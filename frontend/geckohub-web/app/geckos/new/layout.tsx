import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "게코 등록",
  description: "새 크레스티드 게코를 등록하고 이름, 모프, 성별, 생년월일 등 개체 정보를 입력하세요.",
  robots: { index: false, follow: false },
};

export default function NewGeckoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
