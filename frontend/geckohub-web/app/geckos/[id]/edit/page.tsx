"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function EditGeckoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    morph: "",
    gender: "Unknown",
    birth_date: "",
    description: "",
  });
  const [file, setFile] = useState<File | null>(null);

  // 1. 기존 데이터 불러오기
  useEffect(() => {
    // params가 Promise인 경우를 대비해 처리 (Next.js 15 대응)
    const fetchData = async () => {
      // params가 Promise라면 await, 아니라면 그냥 사용
      const resolvedParams = await Promise.resolve(params);

      try {
        const res = await fetch(
          `http://127.0.0.1:8000/api/geckos/${resolvedParams.id}/`
        );
        if (!res.ok) throw new Error("데이터 불러오기 실패");

        const data = await res.json();
        setFormData({
          name: data.name,
          morph: data.morph || "",
          gender: data.gender,
          birth_date: data.birth_date || "",
          description: data.description || "",
        });
        // 기존 이미지가 있으면 미리보기에 세팅
        if (data.profile_image) {
          setPreview(data.profile_image);
        }
      } catch (err) {
        console.error(err);
        alert("정보를 불러오지 못했습니다.");
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params, router]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert("이름을 입력해주세요.");

    // 로딩바 대신 '저장 중...' 텍스트 변경으로 처리
    const submitBtn = document.getElementById(
      "submit-btn"
    ) as HTMLButtonElement;
    if (submitBtn) submitBtn.disabled = true;
    if (submitBtn) submitBtn.innerText = "수정 중...";

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("morph", formData.morph);
      data.append("gender", formData.gender);
      if (formData.birth_date) data.append("birth_date", formData.birth_date);
      data.append("description", formData.description);

      // 파일이 새로 선택되었을 때만 전송 (선택 안 하면 기존 사진 유지됨)
      if (file) {
        data.append("profile_image", file);
      }

      const resolvedParams = await Promise.resolve(params);

      // PATCH 메서드 사용 (부분 수정)
      const res = await fetch(
        `http://127.0.0.1:8000/api/geckos/${resolvedParams.id}/`,
        {
          method: "PATCH",
          body: data,
        }
      );

      if (!res.ok) throw new Error("수정 실패");

      alert("수정되었습니다!");
      router.push(`/geckos/${resolvedParams.id}`); // 상세 페이지로 이동
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("오류가 발생했습니다.");
      if (submitBtn) submitBtn.disabled = false;
      if (submitBtn) submitBtn.innerText = "수정 완료";
    }
  };

  if (loading) return <div className="p-8">로딩 중...</div>;

  return (
    <main className="min-h-screen p-8 bg-gray-50 text-black">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold mb-6">🛠 정보 수정하기</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 이미지 업로드 영역 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              프로필 사진
            </label>
            <div className="flex items-center space-x-4">
              <div className="relative w-24 h-24 bg-gray-200 rounded-lg overflow-hidden border">
                {preview ? (
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    className="object-cover"
                    unoptimized // 로컬 이미지 미리보기 호환
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                    No Image
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              * 사진을 변경하려면 파일을 선택하세요.
            </p>
          </div>

          {/* 기본 정보 입력 (기존 값 채워져 있음) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                이름 *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                모프
              </label>
              <input
                type="text"
                name="morph"
                value={formData.morph}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                성별
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="Unknown">미구분</option>
                <option value="Male">수컷</option>
                <option value="Female">암컷</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                해칭일
              </label>
              <input
                type="date"
                name="birth_date"
                value={formData.birth_date}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              특이사항
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            {/* 취소 시 상세 페이지로 돌아감 */}
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              취소
            </button>
            <button
              id="submit-btn"
              type="submit"
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              수정 완료
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
