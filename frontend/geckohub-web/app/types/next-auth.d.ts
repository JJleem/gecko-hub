// types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Session 객체에 우리가 원하는 커스텀 필드(djangoToken, id)를 추가합니다.
   */
  interface Session {
    user: {
      djangoToken?: string;
      id?: number; // Django 유저 ID (Integer)
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  /**
   * JWT 토큰에도 커스텀 필드를 추가합니다.
   */
  interface JWT {
    djangoAccessToken?: string;
    userId?: number;
  }
}
