"use client";

import { useRouter } from "next/navigation";

export default function DeleteButton({ id }: { id: number }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (
      !confirm(
        "정말 이 개체 정보를 삭제하시겠습니까?\n(이 작업은 되돌릴 수 없습니다.)"
      )
    )
      return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/geckos/${id}/`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("삭제 실패");

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
