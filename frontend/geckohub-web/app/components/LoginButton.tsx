"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect } from "react";
import Image from "next/image";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { LogOut } from "lucide-react";
import { useGeckoStore } from "@/app/stores/geckoStore";

export default function LoginButton() {
  const { data: session, status } = useSession();
  const clearGeckoStore = useGeckoStore((s) => s.clear);

  // Django 토큰 만료 검사
  useEffect(() => {
    const checkToken = async (token: string) => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/settings/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (res.status === 401) {
          console.warn("Django 토큰 만료됨. 자동 로그아웃을 진행합니다.");
          signOut();
        }
      } catch (error) {
        console.error("토큰 검사 중 오류:", error);
      }
    };

    if (status === "authenticated" && session?.user?.djangoToken) {
      checkToken(session.user.djangoToken);
    }
  }, [session, status]);

  // 1. 세션 로딩 중일 때 (깜빡임 방지)
  if (status === "loading") {
    return (
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
    );
  }

  // 2. 로그인 완료 상태
  if (session) {
    return (
      <div className="flex items-center gap-3">
        {/* 데스크톱에서만 보이는 환영 메시지 */}
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-bold text-foreground">
            {session.user?.name}님
          </span>
          <span className="text-xs text-muted-foreground">환영합니다</span>
        </div>

        {/* 프로필 이미지 (있을 경우) */}
        {session.user?.image ? (
          <div className="relative w-9 h-9 rounded-full overflow-hidden border border-border shadow-sm">
            <Image
              src={session.user.image}
              alt="프로필"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm border border-border">
            {session.user?.name?.[0] || "U"}
          </div>
        )}

        <Button
          onClick={() => { clearGeckoStore(); signOut(); }}
          variant="outline"
          size="sm"
          className="gap-2 hidden sm:flex"
        >
          <LogOut className="w-4 h-4" />
          로그아웃
        </Button>

        {/* 모바일용 아이콘 로그아웃 버튼 */}
        <Button
          onClick={() => { clearGeckoStore(); signOut(); }}
          variant="outline"
          size="icon"
          className="sm:hidden"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  // 3. 로그아웃 상태 (로그인 버튼 표시)
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Button
        variant="outline"
        onClick={() => signIn("google")}
        className="gap-2 font-medium shadow-sm transition-all"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 48 48"
        >
          <path
            fill="#FFC107"
            d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
          />
          <path
            fill="#FF3D00"
            d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
          />
          <path
            fill="#4CAF50"
            d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
          />
          <path
            fill="#1976D2"
            d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
          />
        </svg>
        {/* 모바일에서는 글자 숨기고 아이콘만 표시 */}
        <span className="hidden sm:inline">구글 로그인</span>
      </Button>

      {/* <Button
        onClick={() => signIn("kakao")}
        className="bg-[#FEE500] hover:bg-[#FDD800] text-black gap-2 font-medium shadow-sm transition-all border-none"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 3c5.523 0 10 3.582 10 8 0 2.87-1.88 5.42-4.83 6.82l1.17 4.3c.12.44-.46.8-.82.52l-5.2-4.05c-.11.01-.22.01-.32.01-5.523 0-10-3.582-10-8s4.477-8 10-8z" />
        </svg>
        <span className="hidden sm:inline">카카오 로그인</span>
      </Button> */}
    </div>
  );
}
