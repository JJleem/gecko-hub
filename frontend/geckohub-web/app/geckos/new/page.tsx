"use client"; // 필수: 폼 입력은 클라이언트에서 일어남

import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function NewGeckoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // 폼 데이터 상태 관리
  const [formData, setFormData] = useState({
    name: "",
    morph: "",
    gender: "Unknown",
    birth_date: "",
    description: "",
  });
  const [file, setFile] = useState<File | null>(null);

  // 텍스트 입력 핸들러
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 이미지 파일 선택 및 미리보기 핸들러
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // 미리보기 URL 생성
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
    }
  };

  // 전송 핸들러
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert("이름을 입력해주세요.");

    setLoading(true);

    try {
      // 1. FormData 객체 생성 (이미지 전송을 위해 필수)
      const data = new FormData();
      data.append("name", formData.name);
      data.append("morph", formData.morph);
      data.append("gender", formData.gender);
      if (formData.birth_date) data.append("birth_date", formData.birth_date);
      data.append("description", formData.description);

      // 이미지가 있을 때만 추가
      if (file) {
        data.append("profile_image", file);
      }

      // 2. 백엔드로 전송 (Content-Type 헤더를 설정하지 않아야 함! 브라우저가 알아서 설정)
      const res = await fetch("http://127.0.0.1:8000/api/geckos/", {
        method: "POST",
        body: data,
      });

      if (!res.ok) {
        throw new Error("등록 실패");
      }

      // 3. 성공 시 메인으로 이동 및 새로고침
      alert("등록되었습니다!");
      router.push("/");
      router.refresh(); // 데이터 갱신
    } catch (error) {
      console.error(error);
      alert("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50 text-black">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold mb-6">🦎 새 가족 등록하기</h1>

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
          </div>

          {/* 기본 정보 입력 */}
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
                placeholder="예: 릴리 화이트"
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
            <Link
              href="/"
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "등록 중..." : "등록하기"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
