// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import Providers from "./components/Provider";

import { ThemeToggle } from "./components/theme-toggle";
import LoginButton from "./components/LoginButton";
import { Toaster } from "./components/ui/sonner";
import { Header } from "./components/layout/main-nav";
import { Footer } from "./components/layout/footer";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://geckohub.vercel.app"),
  title: {
    default: "GeckoHub — 크레스티드 게코 관리 매니저",
    template: "%s | GeckoHub",
  },
  description:
    "크레스티드 게코 브리더를 위한 개체 통합 관리 앱. 피딩·체중·혈통·사육일지·인큐베이터·유전자 계산기를 한 곳에서 관리하세요.",
  keywords: [
    "크레스티드 게코",
    "게코 관리",
    "crested gecko",
    "파충류 사육",
    "브리더",
    "사육일지",
    "모프",
    "혈통",
    "인큐베이터",
    "GeckoHub",
  ],
  authors: [{ name: "JJleem", url: "https://github.com/JJleem" }],
  creator: "JJleem",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://geckohub.vercel.app",
    siteName: "GeckoHub",
    title: "GeckoHub — 크레스티드 게코 관리 매니저",
    description:
      "크레스티드 게코 브리더를 위한 개체 통합 관리 앱. 피딩·체중·혈통·사육일지를 한 곳에서.",
    images: [
      {
        url: "/og/og-default.png",
        width: 1200,
        height: 630,
        alt: "GeckoHub — 크레스티드 게코 관리 매니저",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GeckoHub — 크레스티드 게코 관리 매니저",
    description:
      "크레스티드 게코 브리더를 위한 개체 통합 관리 앱. 피딩·체중·혈통·사육일지를 한 곳에서.",
    images: ["/og/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${nunito.variable} font-[family-name:var(--font-nunito)]`}>
        <Providers>
          {/* 본문 바로가기 — 키보드 사용자용 skip link */}
          <a href="#main-content" className="skip-link">
            본문 바로가기
          </a>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main id="main-content" className="flex-1" tabIndex={-1}>
              {children}
            </main>
            <Footer />
            <Toaster position="top-center" richColors />
          </div>
        </Providers>
      </body>
    </html>
  );
}
