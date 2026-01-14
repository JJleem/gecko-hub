"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function LoginButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-gray-800 font-bold">
          {session.user?.name}님 환영합니다!
        </p>
        <button
          onClick={() => signOut()}
          className="bg-gray-200 px-4 py-2 rounded-lg text-sm"
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
        className="bg-white border p-3 rounded-xl shadow-sm flex items-center gap-2"
      >
        구글 로그인
      </button>
      <button
        onClick={() => signIn("kakao")}
        className="bg-[#FEE500] p-3 rounded-xl shadow-sm flex items-center gap-2"
      >
        카카오 로그인
      </button>
    </div>
  );
}
