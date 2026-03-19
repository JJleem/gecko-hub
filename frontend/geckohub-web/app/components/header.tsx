"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { Egg, Dna, Menu, Home } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "./ui/sheet";
import { Button } from "./ui/button";

const navItems = [
  { href: "/", label: "홈", icon: Home },
  { href: "/incubator", label: "인큐베이터", icon: Egg },
  { href: "/calculator", label: "유전자 계산기", icon: Dna },
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2 shrink-0">
            <span className="font-bold text-lg">🦎 GeckoHub</span>
          </Link>

          {/* 데스크탑 네비게이션 */}
          <nav className="hidden sm:flex items-center gap-1">
            {navItems
              .filter((item) => item.href !== "/")
              .map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors
                      ${
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
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* 모바일 햄버거 버튼 */}
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
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <SheetClose key={href} asChild>
                  <Link
                    href={href}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors
                      ${
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
