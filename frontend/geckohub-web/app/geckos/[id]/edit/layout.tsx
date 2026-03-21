import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "정보 수정",
  description: "게코 개체 정보를 수정하세요.",
  robots: { index: false, follow: false },
};

export default function EditGeckoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
