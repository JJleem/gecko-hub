"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "../theme-toggle";
import LoginButton from "../LoginButton";
import { Leaf, Egg, Dna, Home, Menu, CalendarDays } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "../ui/sheet";
import { Button } from "../ui/button";

const NAV_LINKS = [
  { href: "/", label: "홈", icon: Home },
  { href: "/calendar", label: "캘린더", icon: CalendarDays },
  { href: "/incubator", label: "인큐베이터", icon: Egg },
  { href: "/calculator", label: "유전자 계산기", icon: Dna },
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4 max-w-7xl">

        {/* Logo */}
        <Link
          href="/"
          aria-label="GeckoHub 홈으로"
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm" aria-hidden="true">
            <Leaf className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-[18px] font-extrabold tracking-tight text-foreground">
            Gecko<span className="text-primary">Hub</span>
          </span>
        </Link>

        {/* 데스크탑 Nav */}
        <nav className="hidden sm:flex items-center gap-1" aria-label="주요 메뉴">
          {NAV_LINKS.filter((l) => l.href !== "/").map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* 우측 영역 */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LoginButton />

          {/* 모바일 햄버거 */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden rounded-full w-9 h-9"
            onClick={() => setMobileOpen(true)}
            aria-label="메뉴 열기"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* 모바일 슬라이드 메뉴 */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="px-6 py-5 border-b border-border/40">
            <SheetTitle className="text-left">
              <span className="font-extrabold text-lg">🦎 GeckoHub</span>
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-3 py-4" aria-label="모바일 메뉴">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <SheetClose key={href} asChild>
                  <Link
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                    {label}
                  </Link>
                </SheetClose>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
