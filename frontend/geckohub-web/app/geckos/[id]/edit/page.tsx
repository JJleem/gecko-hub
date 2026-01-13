"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Gecko } from "@/app/types/gecko";

export default function EditGeckoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [males, setMales] = useState<Gecko[]>([]);
  const [females, setFemales] = useState<Gecko[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    morph: "",
    gender: "Unknown",
    birth_date: "",
    description: "",
    sire: "",
    dam: "",
    is_ovulating: false,
    tail_loss: false,
    mbd: false,
    has_spots: false,
    acquisition_type: "Purchased",
    acquisition_source: "",
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const init = async () => {
      const resolvedParams = await Promise.resolve(params);

      try {
        const myRes = await fetch(
          `http://127.0.0.1:8000/api/geckos/${resolvedParams.id}/`
        );
        const myData = await myRes.json();

        const listRes = await fetch("http://127.0.0.1:8000/api/geckos/");
        const listData: Gecko[] = await listRes.json();

        setFormData({
          name: myData.name,
          morph: myData.morph || "",
          gender: myData.gender,
          birth_date: myData.birth_date || "",
          description: myData.description || "",
          sire: myData.sire ? String(myData.sire) : "",
          dam: myData.dam ? String(myData.dam) : "",
          is_ovulating: myData.is_ovulating || false,
          tail_loss: myData.tail_loss || false,
          mbd: myData.mbd || false,
          has_spots: myData.has_spots || false,
          acquisition_type: myData.acquisition_type || "Purchased",
          acquisition_source: myData.acquisition_source || "",
        });
        if (myData.profile_image) setPreview(myData.profile_image);

        const others = listData.filter(
          (g) => g.id !== Number(resolvedParams.id)
        );
        setMales(others.filter((g) => g.gender === "Male"));
        setFemales(others.filter((g) => g.gender === "Female"));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [params, router]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    // 성별이 바뀌면 배란/발정 체크를 초기화하는 것이 안전함
    if (name === "gender") {
      setFormData((prev) => ({ ...prev, [name]: value, is_ovulating: false }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
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
      // ⭐ [중요] boolean 값을 문자열 "true"/"false"로 확실하게 변환
      data.append("is_ovulating", formData.is_ovulating ? "true" : "false");

      if (formData.birth_date) data.append("birth_date", formData.birth_date);
      data.append("description", formData.description);

      // 부모 정보 추가 (빈 문자열 처리)
      data.append("sire", formData.sire || "");
      data.append("dam", formData.dam || "");
      data.append("tail_loss", formData.tail_loss ? "true" : "false");
      data.append("mbd", formData.mbd ? "true" : "false");
      data.append("has_spots", formData.has_spots ? "true" : "false");
      data.append("acquisition_type", formData.acquisition_type);
      data.append("acquisition_source", formData.acquisition_source);
      if (file) {
        data.append("profile_image", file);
      }

      const resolvedParams = await Promise.resolve(params);

      const res = await fetch(
        `http://127.0.0.1:8000/api/geckos/${resolvedParams.id}/`,
        {
          method: "PATCH",
          body: data,
        }
      );

      if (!res.ok) throw new Error("수정 실패");

      alert("수정되었습니다!");
      router.push(`/geckos/${resolvedParams.id}`);
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
                    unoptimized
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
            {/* 🏥 1. 건강 및 특징 (체크박스 그룹) */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 mb-3">
                🏥 건강 및 특징
              </h3>
              <div className="flex space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.tail_loss}
                    onChange={(e) =>
                      setFormData({ ...formData, tail_loss: e.target.checked })
                    }
                    className="w-4 h-4 text-orange-500 rounded focus:ring-orange-400"
                  />
                  <span className="text-sm text-gray-700">
                    ✂️ 꼬리 부절 (Tail Loss)
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.mbd}
                    onChange={(e) =>
                      setFormData({ ...formData, mbd: e.target.checked })
                    }
                    className="w-4 h-4 text-red-500 rounded focus:ring-red-400"
                  />
                  <span className="text-sm text-gray-700">🦴 MBD 이력</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_spots}
                    onChange={(e) =>
                      setFormData({ ...formData, has_spots: e.target.checked })
                    }
                    className="w-4 h-4 text-gray-800 rounded focus:ring-gray-600"
                  />
                  <span className="text-sm text-gray-700">
                    ⚫ 점 있음 (Spots)
                  </span>
                </label>
              </div>
            </div>

            {/* 🏠 2. 입양 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  입양 구분
                </label>
                <select
                  value={formData.acquisition_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      acquisition_type: e.target.value,
                    })
                  }
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="Purchased">🏠 입양 (분양)</option>
                  <option value="Hatched">🐣 직접 해칭 (Self)</option>
                  <option value="Rescue">🚑 구조/기타</option>
                </select>
              </div>

              {/* 직접 해칭이 아닐 때만 입양처 입력칸 보이기 */}
              {formData.acquisition_type !== "Hatched" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.acquisition_type === "Rescue"
                      ? "구조 장소/경로"
                      : "입양처 (브리더/샵)"}
                  </label>
                  <input
                    type="text"
                    value={formData.acquisition_source}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        acquisition_source: e.target.value,
                      })
                    }
                    placeholder="예: 게코파크, 홍길동 브리더"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 🔥 [변경] 성별에 따른 조건부 렌더링 영역 */}
          {formData.gender !== "Unknown" && (
            <div
              className={`flex items-center p-4 rounded-lg border 
                ${
                  formData.gender === "Female"
                    ? "bg-red-50 border-red-100"
                    : "bg-blue-50 border-blue-100"
                }`}
            >
              <input
                type="checkbox"
                id="ovulating"
                checked={formData.is_ovulating}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_ovulating: e.target.checked,
                  }))
                }
                className={`w-5 h-5 rounded border-gray-300 
                    ${
                      formData.gender === "Female"
                        ? "text-red-600 focus:ring-red-500"
                        : "text-blue-600 focus:ring-blue-500"
                    }`}
              />
              <label
                htmlFor="ovulating"
                className={`ml-3 text-sm font-bold 
                    ${
                      formData.gender === "Female"
                        ? "text-red-700"
                        : "text-blue-700"
                    }`}
              >
                {formData.gender === "Female"
                  ? "현재 배란(Ovulation) 진행 중인가요? 🥚"
                  : "현재 발정(Rut) 상태인가요? 🔥"}
              </label>
            </div>
          )}

          {/* 부모 선택 영역 (기존 유지) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                부 (Sire)
              </label>
              <select
                name="sire"
                value={formData.sire}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">선택 안 함 (Unknown)</option>
                {males.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.morph})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                모 (Dam)
              </label>
              <select
                name="dam"
                value={formData.dam}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">선택 안 함 (Unknown)</option>
                {females.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.morph})
                  </option>
                ))}
              </select>
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
