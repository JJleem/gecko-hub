import type { Metadata } from "next";

// 게코 상세 페이지는 로그인 필요 → noindex
// 동적 OG 이미지가 필요하다면 generateMetadata + 서버 API 호출로 확장 가능
export const metadata: Metadata = {
  title: "게코 상세",
  description:
    "게코의 성장 기록, 혈통, 사육일지, 체중 추이, 번식 현황을 확인하고 관리하세요.",
  robots: { index: false, follow: false },
};

export default function GeckoDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
