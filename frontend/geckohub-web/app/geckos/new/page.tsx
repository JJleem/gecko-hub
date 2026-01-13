"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import MorphModal from "@/app/components/MorphModal";
import { Gecko } from "@/app/types/gecko";

export default function NewGeckoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // 모프 모달 상태
  const [isMorphModalOpen, setIsMorphModalOpen] = useState(false);

  // 🔥 [추가] 부모 직접 입력 모드 여부
  const [isManualSire, setIsManualSire] = useState(false);
  const [isManualDam, setIsManualDam] = useState(false);

  // 부모 후보군 데이터
  const [males, setMales] = useState<Gecko[]>([]);
  const [females, setFemales] = useState<Gecko[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    morph: "",
    gender: "Unknown",
    birth_date: "",
    description: "",

    // 부모 정보
    sire: "", // ID
    sire_name: "", // [추가] 직접 입력 이름
    dam: "", // ID
    dam_name: "", // [추가] 직접 입력 이름

    tail_loss: false,
    mbd: false,
    has_spots: false,
    acquisition_type: "Purchased",
    acquisition_source: "",
    weight: "",
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/geckos/");
        if (res.ok) {
          const data: Gecko[] = await res.json();
          setMales(data.filter((g) => g.gender === "Male"));
          setFemales(data.filter((g) => g.gender === "Female"));
        }
      } catch (error) {
        console.error("부모 후보군 로딩 실패", error);
      }
    };
    fetchCandidates();
  }, []);

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

    setLoading(true);

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("morph", formData.morph);
      data.append("gender", formData.gender);
      if (formData.birth_date) data.append("birth_date", formData.birth_date);
      data.append("description", formData.description);

      // 🔥 [수정] 부모 정보 처리 로직 (ID vs 이름)
      if (!isManualSire && formData.sire) {
        data.append("sire", formData.sire);
      } else if (isManualSire && formData.sire_name) {
        data.append("sire_name", formData.sire_name);
      }

      if (!isManualDam && formData.dam) {
        data.append("dam", formData.dam);
      } else if (isManualDam && formData.dam_name) {
        data.append("dam_name", formData.dam_name);
      }

      data.append("tail_loss", formData.tail_loss ? "true" : "false");
      data.append("mbd", formData.mbd ? "true" : "false");
      data.append("has_spots", formData.has_spots ? "true" : "false");
      data.append("acquisition_type", formData.acquisition_type);
      data.append("acquisition_source", formData.acquisition_source);
      if (formData.weight) data.append("weight", formData.weight);

      if (file) {
        data.append("profile_image", file);
      }

      const res = await fetch("http://127.0.0.1:8000/api/geckos/", {
        method: "POST",
        body: data,
      });

      if (!res.ok) throw new Error("등록 실패");

      alert("등록되었습니다!");
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50 text-black">
      <MorphModal
        isOpen={isMorphModalOpen}
        onClose={() => setIsMorphModalOpen(false)}
        initialSelected={formData.morph}
        onApply={(selectedMorphs) => {
          setFormData((prev) => ({ ...prev, morph: selectedMorphs }));
        }}
      />

      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold mb-6">🦎 새 가족 등록하기</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ... 이미지, 기본 정보 (기존 동일) ... */}
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
              <div
                onClick={() => setIsMorphModalOpen(true)}
                className="mt-1 flex w-full items-center rounded-md border border-gray-300 px-3 py-2 shadow-sm cursor-pointer hover:border-blue-500 hover:ring-1 hover:ring-blue-500 bg-white min-h-[42px]"
              >
                {formData.morph ? (
                  <div className="flex flex-wrap gap-1">
                    {formData.morph.split(",").map((m, idx) => (
                      <span
                        key={idx}
                        className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium"
                      >
                        {m.trim()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400 text-sm">
                    모프를 선택해주세요
                  </span>
                )}
              </div>
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

            {/* 몸무게 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                현재 몸무게 (g)
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <input
                  type="number"
                  step="0.1"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="0.0"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 sm:text-sm">g</span>
                </div>
              </div>
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
                <span className="text-sm text-gray-700">✂️ 꼬리 부절</span>
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
                <span className="text-sm text-gray-700">⚫ 점 있음</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                입양 구분
              </label>
              <select
                value={formData.acquisition_type}
                onChange={(e) =>
                  setFormData({ ...formData, acquisition_type: e.target.value })
                }
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="Purchased">🏠 입양 (분양)</option>
                <option value="Hatched">🐣 직접 해칭 (Self)</option>
                <option value="Rescue">🚑 구조/기타</option>
              </select>
            </div>
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

          {/* 🔥 [변경] 부모 선택 영역 (직접 입력 토글 추가) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            {/* 아빠 (Sire) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  부 (Sire)
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="manualSire"
                    checked={isManualSire}
                    onChange={(e) => setIsManualSire(e.target.checked)}
                    className="w-3 h-3 text-blue-600 rounded"
                  />
                  <label
                    htmlFor="manualSire"
                    className="ml-1 text-xs text-gray-500 cursor-pointer"
                  >
                    직접 입력
                  </label>
                </div>
              </div>
              {!isManualSire ? (
                <select
                  name="sire"
                  value={formData.sire}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">선택 안 함 (Unknown)</option>
                  {males.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.morph})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  name="sire_name"
                  value={formData.sire_name}
                  onChange={handleChange}
                  placeholder="부 개체 이름 직접 입력"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              )}
            </div>

            {/* 엄마 (Dam) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  모 (Dam)
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="manualDam"
                    checked={isManualDam}
                    onChange={(e) => setIsManualDam(e.target.checked)}
                    className="w-3 h-3 text-pink-600 rounded"
                  />
                  <label
                    htmlFor="manualDam"
                    className="ml-1 text-xs text-gray-500 cursor-pointer"
                  >
                    직접 입력
                  </label>
                </div>
              </div>
              {!isManualDam ? (
                <select
                  name="dam"
                  value={formData.dam}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">선택 안 함 (Unknown)</option>
                  {females.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.morph})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  name="dam_name"
                  value={formData.dam_name}
                  onChange={handleChange}
                  placeholder="모 개체 이름 직접 입력"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              )}
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
