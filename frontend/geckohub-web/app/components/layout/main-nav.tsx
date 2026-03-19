"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "../theme-toggle";
import LoginButton from "../LoginButton";
import { Leaf, Egg, Dna, Home, Menu } from "lucide-react";
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
  { href: "/incubator", label: "인큐베이터", icon: Egg },
  { href: "/calculator", label: "유전자 계산기", icon: Dna },
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-card/90 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Leaf className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Gecko<span className="text-primary">Hub</span>
          </span>
        </Link>

        {/* 데스크탑 Nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {NAV_LINKS.filter((l) => l.href !== "/").map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4" />
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
          <SheetHeader className="px-6 py-5 border-b border-border/50">
            <SheetTitle className="text-left">
              <span className="font-bold text-lg">🦎 GeckoHub</span>
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-3 py-4">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <SheetClose key={href} asChild>
                  <Link
                    href={href}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
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
