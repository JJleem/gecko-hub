"use client";

import { useState, useEffect, ChangeEvent, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Gecko } from "@/app/types/gecko";
import MorphModal from "@/app/components/MorphModal";

// shadcn/ui 컴포넌트 임포트 (경로를 프로젝트에 맞게 확인하세요)
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Switch } from "../../components/ui/switch";
import { Separator } from "../../components/ui/separator";
import {
  Camera,
  ImagePlus,
  Loader2,
  Sparkles,
  HeartPulse,
  Dna,
  Info,
} from "lucide-react";
import { toast } from "sonner";

export default function NewGeckoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isMorphModalOpen, setIsMorphModalOpen] = useState(false);
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 부모 직접 입력 모드 상태
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
    weight: "",
    description: "",

    sire: "none",
    sire_name: "",
    dam: "none",
    dam_name: "",

    is_ovulating: false,
    tail_loss: false,
    mbd: false,
    has_spots: false,
    acquisition_type: "Purchased",
    acquisition_source: "",
  });
  const [file, setFile] = useState<File | null>(null);

  // 부모 후보군 로딩
  useEffect(() => {
    const fetchCandidates = async () => {
      if (!session?.user?.djangoToken) return;
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/geckos/`,
          {
            headers: {
              Authorization: `Bearer ${session.user.djangoToken}`,
              "Content-Type": "application/json",
            },
          },
        );
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
  }, [session]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // shadcn Select, Switch용 상태 업데이트 함수
  const handleSelectChange = (name: string, value: string) => {
    if (name === "gender") {
      setFormData((prev) => ({ ...prev, [name]: value, is_ovulating: false }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
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

    // 💡 alert 교체 1: 이름 미입력
    if (!formData.name) {
      return toast.error("이름을 입력해주세요.", {
        description: "게코의 이름은 필수 항목입니다.",
      });
    }

    // 💡 alert 교체 2: 세션 만료
    if (!session?.user?.djangoToken) {
      return toast.warning("로그인 세션이 만료되었습니다.", {
        description: "다시 로그인한 후 시도해주세요.",
      });
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("morph", formData.morph);
      data.append("gender", formData.gender);
      data.append("is_ovulating", formData.is_ovulating ? "true" : "false");

      if (formData.birth_date) data.append("birth_date", formData.birth_date);
      if (formData.weight) data.append("weight", formData.weight);
      data.append("description", formData.description);

      // 부모 정보
      if (isManualSire) {
        data.append("sire_name", formData.sire_name);
      } else if (formData.sire !== "none") {
        data.append("sire", formData.sire);
      }

      if (isManualDam) {
        data.append("dam_name", formData.dam_name);
      } else if (formData.dam !== "none") {
        data.append("dam", formData.dam);
      }

      // 건강 및 입양
      data.append("tail_loss", formData.tail_loss ? "true" : "false");
      data.append("mbd", formData.mbd ? "true" : "false");
      data.append("has_spots", formData.has_spots ? "true" : "false");
      data.append("acquisition_type", formData.acquisition_type);
      data.append("acquisition_source", formData.acquisition_source);

      if (file) {
        data.append("profile_image", file);
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/geckos/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.user.djangoToken}`,
          },
          body: data,
        },
      );

      if (!res.ok) throw new Error(`등록 실패`);

      // 💡 alert 교체 3: 등록 성공
      toast.success("새로운 가족이 등록되었습니다! 🎉", {
        description: `${formData.name}의 프로필이 성공적으로 생성되었습니다.`,
      });

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error(error);

      // 💡 alert 교체 4: 서버 에러
      toast.error("등록 중 오류가 발생했습니다.", {
        description: "잠시 후 다시 시도하거나 관리자에게 문의하세요.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 bg-background text-foreground transition-colors duration-300">
      <MorphModal
        isOpen={isMorphModalOpen}
        onClose={() => setIsMorphModalOpen(false)}
        initialSelected={formData.morph}
        onApply={(selectedMorphs) =>
          handleSelectChange("morph", selectedMorphs)
        }
      />

      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-primary" />새 가족 등록하기
            </h1>
            <p className="text-muted-foreground mt-1">
              새로운 크레스티드 게코의 프로필을 완성해주세요.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* 왼쪽: 기본 정보 및 사진 영역 */}
          <div className="lg:col-span-5 space-y-6">
            <Card>
              <CardContent className="p-6">
                {/* 사진 업로드 UI 개선 */}
                <div className="flex flex-col items-center justify-center space-y-4 mb-8">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative w-40 h-40 rounded-full border-4 border-dashed flex flex-col items-center justify-center overflow-hidden cursor-pointer transition-all hover:bg-muted/50 ${
                      preview
                        ? "border-primary/50"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {preview ? (
                      <Image
                        src={preview}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <>
                        <ImagePlus className="w-10 h-10 text-muted-foreground mb-2" />
                        <span className="text-xs text-muted-foreground font-medium">
                          사진 업로드
                        </span>
                      </>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      이름 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="게코 이름을 입력하세요"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>모프 (Morph)</Label>
                    <div
                      onClick={() => setIsMorphModalOpen(true)}
                      className="flex min-h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      {formData.morph ? (
                        <div className="flex flex-wrap gap-1">
                          {formData.morph.split(",").map((m, idx) => (
                            <span
                              key={idx}
                              className="bg-primary/15 text-primary text-xs px-2.5 py-0.5 rounded-full font-semibold"
                            >
                              {m.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          모프 선택하기
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>성별</Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(val) =>
                          handleSelectChange("gender", val)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="성별 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Unknown">미구분</SelectItem>
                          <SelectItem value="Male">♂ 수컷</SelectItem>
                          <SelectItem value="Female">♀ 암컷</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight">무게 (g)</Label>
                      <Input
                        id="weight"
                        name="weight"
                        type="number"
                        step="0.01"
                        value={formData.weight}
                        onChange={handleChange}
                        placeholder="0.0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birth_date">해칭일 (Birth Date)</Label>
                    <Input
                      id="birth_date"
                      name="birth_date"
                      type="date"
                      value={formData.birth_date}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽: 혈통, 건강, 세부 정보 영역 */}
          <div className="lg:col-span-7 space-y-6">
            {/* 성별 특화 상태 (발정/배란) */}
            {formData.gender !== "Unknown" && (
              <Card
                className={`border-2 ${formData.gender === "Female" ? "border-red-500/20 bg-red-500/5" : "border-blue-500/20 bg-blue-500/5"}`}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HeartPulse
                      className={
                        formData.gender === "Female"
                          ? "text-red-500"
                          : "text-blue-500"
                      }
                    />
                    <div className="space-y-0.5">
                      <Label className="text-base font-bold">
                        {formData.gender === "Female"
                          ? "배란(Ovulation) 상태인가요?"
                          : "발정(Rut) 상태인가요?"}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        상태를 체크해두면 스케줄 관리에 도움이 됩니다.
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.is_ovulating}
                    onCheckedChange={(c) =>
                      handleSwitchChange("is_ovulating", c)
                    }
                    className="data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-700"
                  />
                </CardContent>
              </Card>
            )}

            {/* 혈통 정보 (Lineage) */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Dna className="w-5 h-5" /> 부모 혈통 (Lineage)
                </CardTitle>
                <CardDescription>
                  혈통 추적을 위해 부모 개체를 연결하거나 직접 입력하세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 부 (Sire) */}
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold text-blue-600 dark:text-blue-400">
                      부 (Sire)
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="manualSire"
                        checked={isManualSire}
                        onCheckedChange={setIsManualSire}
                        className="data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-700"
                      />
                      <Label
                        htmlFor="manualSire"
                        className="text-xs text-muted-foreground cursor-pointer"
                      >
                        직접 입력
                      </Label>
                    </div>
                  </div>
                  {!isManualSire ? (
                    <Select
                      value={formData.sire}
                      onValueChange={(val) => handleSelectChange("sire", val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="등록된 수컷 중 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          선택 안 함 (Unknown)
                        </SelectItem>
                        {males.map((g) => (
                          <SelectItem key={g.id} value={g.id.toString()}>
                            {g.name} ({g.morph})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      name="sire_name"
                      value={formData.sire_name}
                      onChange={handleChange}
                      placeholder="부 개체 이름 직접 입력"
                    />
                  )}
                </div>

                {/* 모 (Dam) */}
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold text-pink-600 dark:text-pink-400">
                      모 (Dam)
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="manualDam"
                        checked={isManualDam}
                        onCheckedChange={setIsManualDam}
                        className="data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-700"
                      />
                      <Label
                        htmlFor="manualDam"
                        className="text-xs text-muted-foreground cursor-pointer"
                      >
                        직접 입력
                      </Label>
                    </div>
                  </div>
                  {!isManualDam ? (
                    <Select
                      value={formData.dam}
                      onValueChange={(val) => handleSelectChange("dam", val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="등록된 암컷 중 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          선택 안 함 (Unknown)
                        </SelectItem>
                        {females.map((g) => (
                          <SelectItem key={g.id} value={g.id.toString()}>
                            {g.name} ({g.morph})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      name="dam_name"
                      value={formData.dam_name}
                      onChange={handleChange}
                      placeholder="모 개체 이름 직접 입력"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 건강 및 특징 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <HeartPulse className="w-5 h-5" /> 건강 및 특징
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                    <Label className="cursor-pointer">✂️ 꼬리 부절</Label>
                    <Switch
                      checked={formData.tail_loss}
                      onCheckedChange={(c) =>
                        handleSwitchChange("tail_loss", c)
                      }
                      className="data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-700"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                    <Label className="cursor-pointer">🦴 MBD 이력</Label>
                    <Switch
                      checked={formData.mbd}
                      onCheckedChange={(c) => handleSwitchChange("mbd", c)}
                      className="data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-700"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                    <Label className="cursor-pointer">⚫ 점 </Label>
                    <Switch
                      checked={formData.has_spots}
                      onCheckedChange={(c) =>
                        handleSwitchChange("has_spots", c)
                      }
                      className="data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-700"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 입양 및 세부 사항 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Info className="w-5 h-5" /> 입양 및 세부 사항
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>입양 구분</Label>
                    <Select
                      value={formData.acquisition_type}
                      onValueChange={(val) =>
                        handleSelectChange("acquisition_type", val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Purchased">
                          🏠 입양 (분양)
                        </SelectItem>
                        <SelectItem value="Hatched">
                          🐣 직접 해칭 (Self)
                        </SelectItem>
                        <SelectItem value="Rescue">🚑 구조/기타</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.acquisition_type !== "Hatched" && (
                    <div className="space-y-2">
                      <Label>
                        {formData.acquisition_type === "Rescue"
                          ? "구조 장소/경로"
                          : "입양처 (브리더/샵)"}
                      </Label>
                      <Input
                        name="acquisition_source"
                        value={formData.acquisition_source}
                        onChange={handleChange}
                        placeholder="예: 게코파크, 홍길동 브리더"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>특이사항 메모</Label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="성격, 먹이 반응 등 자유롭게 적어주세요."
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 액션 버튼 */}
            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/")}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="px-8 font-bold"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 등록 중...
                  </>
                ) : (
                  "등록 완료"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
