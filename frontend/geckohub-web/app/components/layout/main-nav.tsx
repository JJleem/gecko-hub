"use client";

import Link from "next/link"; // 🔥 Link 임포트 추가
import { ThemeToggle } from "../theme-toggle";
import LoginButton from "../LoginButton";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* 🔥 Link 태그로 로고 영역 감싸기 */}
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            🦎 GeckoHub
          </h1>
        </Link>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <LoginButton />
        </div>
      </div>
    </header>
  );
}
