"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect } from "react";

export default function LoginButton() {
  const { data: session, status } = useSession();

  // 🔥 [수정] checkToken 함수를 useEffect 안으로 넣어서 순서 문제 해결
  useEffect(() => {
    const checkToken = async (token: string) => {
      try {
        // 2. 가벼운 API(예: settings)를 찔러서 토큰이 살아있는지 확인
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/settings/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // 3. 백엔드가 "401 Unauthorized (인증 실패)"를 돌려주면 로그아웃 시킴
        if (res.status === 401) {
          console.warn("Django 토큰 만료됨. 자동 로그아웃을 진행합니다.");
          signOut(); // 👈 NextAuth 세션 강제 종료
        }
      } catch (error) {
        console.error("토큰 검사 중 오류:", error);
      }
    };

    // 1. 로그인이 되어있는 상태라면 검사 시작
    if (status === "authenticated" && session?.user?.djangoToken) {
      checkToken(session.user.djangoToken);
    }
  }, [session, status]);

  if (session) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-gray-800 font-bold">
          {session.user?.name}님 환영합니다!
        </p>
        <button
          onClick={() => signOut()}
          className="bg-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-300 transition"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      <button
        onClick={() => signIn("google")}
        className="bg-white text-black/90 border p-3 rounded-xl shadow-sm flex items-center gap-2 hover:bg-gray-50 transition"
      >
        {/* 구글 아이콘 (SVG) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
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
        구글 로그인
      </button>
      <button
        onClick={() => signIn("kakao")}
        className="bg-[#FEE500] p-3 rounded-xl shadow-sm flex items-center gap-2 hover:opacity-90 transition text-black/90 font-medium"
      >
        {/* 카카오 아이콘 (SVG) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
        >
          <path d="M12 3c5.523 0 10 3.582 10 8 0 2.87-1.88 5.42-4.83 6.82l1.17 4.3c.12.44-.46.8-.82.52l-5.2-4.05c-.11.01-.22.01-.32.01-5.523 0-10-3.582-10-8s4.477-8 10-8z" />
        </svg>
        카카오 로그인
      </button>
    </div>
  );
}
