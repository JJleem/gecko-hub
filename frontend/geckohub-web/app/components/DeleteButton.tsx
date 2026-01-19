"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react"; // 👈 1. 세션 훅 임포트

export default function DeleteButton({ id }: { id: number }) {
  const router = useRouter();
  const { data: session } = useSession(); // 👈 2. 세션 정보(토큰) 가져오기

  const handleDelete = async () => {
    // 로그인 안 된 상태면 막기
    if (!session?.user?.djangoToken) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (
      !confirm(
        "정말 이 개체 정보를 삭제하시겠습니까?\n(이 작업은 되돌릴 수 없습니다.)",
      )
    )
      return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/geckos/${id}/`, // 주소 환경변수 쓰는 게 좋아요
        {
          method: "DELETE",
          // 👇 3. 여기가 핵심! 토큰을 헤더에 실어 보내야 합니다.
          headers: {
            Authorization: `Bearer ${session.user.djangoToken}`,
          },
        },
      );

      if (!res.ok) {
        // 에러 메시지 확인용
        const errorText = await res.text();
        console.error("삭제 실패 사유:", errorText);
        throw new Error("삭제 실패");
      }

      alert("삭제되었습니다.");
      router.push("/"); // 메인으로 이동
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="px-3 py-1 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition"
    >
      삭제
    </button>
  );
}
