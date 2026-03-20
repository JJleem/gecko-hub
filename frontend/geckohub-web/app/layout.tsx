// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "./components/Provider";

import { ThemeToggle } from "./components/theme-toggle";
import LoginButton from "./components/LoginButton";
import { Toaster } from "./components/ui/sonner";
import { Header } from "./components/layout/main-nav";
import { Footer } from "./components/layout/footer";

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
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <div className="flex-1">{children}</div>
            <Footer />
            <Toaster position="top-center" richColors />
          </div>
        </Providers>
      </body>
    </html>
  );
}
