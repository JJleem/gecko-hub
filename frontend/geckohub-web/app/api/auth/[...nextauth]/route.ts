// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID || "",
      clientSecret: process.env.KAKAO_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // 🔥 로그인이 처음 성공했을 때만 실행됨 (account가 있음)
      if (account && user) {
        console.log("google/kakao 인증 성공. Django로 데이터 전송 시도...");

        try {
          // 1. Django 백엔드로 토큰과 정보를 보냅니다.
          const res = await fetch("http://127.0.0.1:8000/api/auth/social/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider: account.provider, // google 또는 kakao
              access_token: account.access_token, // 소셜 토큰
              email: user.email,
              name: user.name,
            }),
          });

          const data = await res.json();

          if (res.ok) {
            // 2. Django가 응답한 토큰(DB 유저 정보)을 저장
            token.djangoAccessToken = data.access;
            token.userId = data.user_id; // 🔥 내 DB의 유저 ID (이게 제일 중요!)
            console.log("✅ Django 로그인 성공! 유저 ID:", data.user_id);
          } else {
            console.error("❌ Django 로그인 실패:", data);
          }
        } catch (error) {
          console.error("❌ 백엔드 통신 에러 (Django가 켜져 있나요?):", error);
        }
      }
      return token;
    },

    async session({ session, token }) {
      // 3. 브라우저에서 쓸 수 있게 세션에 넣어줌
      if (session.user) {
        session.user.id = token.userId as number; // 이제 session.user.id로 접근 가능
        session.user.djangoToken = token.djangoAccessToken as string;
      }
      return session;
    },
  },
  // pages: { signIn: ... } // 커스텀 페이지 없으면 일단 주석 처리해도 됨
});

export { handler as GET, handler as POST };
