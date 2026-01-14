// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "./components/Provider";
// 🔥 방금 만든 Providers 가져오기

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GeckoHub",
  description: "게코 도마뱀 관리 시스템",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        {/* 🔥 여기서 감싸줘야 useSession을 쓸 수 있습니다 */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
