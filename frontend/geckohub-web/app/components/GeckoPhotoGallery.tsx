"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Plus, Trash2, Star, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { Gecko, GeckoPhoto } from "@/app/types/gecko";

const MAX_EXTRA = 3;

function Spinner({ className = "" }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}

export default function GeckoPhotoGallery({
  gecko,
  onRefresh,
  onMainImageLoading,
}: {
  gecko: Gecko;
  onRefresh?: () => void;
  onMainImageLoading?: (loading: boolean) => void;
}) {
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<number | null>(null);

  const photos: GeckoPhoto[] = gecko.photos ?? [];
  const canUpload = photos.length < MAX_EXTRA;
  const isBusy = uploading || deletingId !== null || settingPrimaryId !== null;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user?.djangoToken) return;
    setUploading(true);
    const form = new FormData();
    form.append("gecko", String(gecko.id));
    form.append("image", file);
    try {
      const res = await apiClient(session.user.djangoToken).postForm("/api/photos/", form);
      if (!res.ok) throw new Error();
      toast.success("사진이 추가됐어요!");
      onRefresh?.();
    } catch {
      toast.error("업로드 실패");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (photoId: number) => {
    if (!session?.user?.djangoToken) return;
    if (!confirm("이 사진을 삭제하시겠습니까?")) return;
    setDeletingId(photoId);
    try {
      const res = await apiClient(session.user.djangoToken).delete(`/api/photos/${photoId}/`);
      if (!res.ok) throw new Error();
      toast.success("삭제됐어요");
      onRefresh?.();
    } catch {
      toast.error("삭제 실패");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetPrimary = async (photoId: number) => {
    if (!session?.user?.djangoToken) return;
    setSettingPrimaryId(photoId);
    onMainImageLoading?.(true);
    try {
      const res = await apiClient(session.user.djangoToken).post(
        `/api/photos/${photoId}/set_primary/`,
        {}
      );
      if (!res.ok) throw new Error();
      toast.success("대표사진이 변경됐어요!");
      onRefresh?.();
    } catch {
      toast.error("변경 실패");
    } finally {
      setSettingPrimaryId(null);
      onMainImageLoading?.(false);
    }
  };

  return (
    <div className="flex gap-2">
      {/* 추가 사진 썸네일 */}
      {photos.map((photo) => {
        const isDeleting = deletingId === photo.id;
        const isSettingPrimary = settingPrimaryId === photo.id;
        const isThisBusy = isDeleting || isSettingPrimary;

        return (
          <div
            key={photo.id}
            className={`relative group w-16 h-16 rounded-xl overflow-hidden border-2 bg-muted flex-shrink-0 transition-all duration-200 ${
              isThisBusy
                ? "border-primary/60 scale-95 opacity-80"
                : "border-border/50 hover:border-primary/60 cursor-pointer"
            }`}
          >
            <Image
              src={photo.image}
              alt="추가 사진"
              fill
              className={`object-cover transition-all duration-300 ${isThisBusy ? "blur-[1px]" : ""}`}
              unoptimized
            />

            {/* 로딩 오버레이 */}
            {isThisBusy && (
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1">
                <Spinner className="w-4 h-4 text-white" />
                <span className="text-[9px] text-white font-medium">
                  {isDeleting ? "삭제중" : "변경중"}
                </span>
              </div>
            )}

            {/* hover 액션 오버레이 (busy 아닐 때만) */}
            {!isThisBusy && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                <button
                  onClick={() => handleSetPrimary(photo.id)}
                  disabled={isBusy}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-yellow-400/90 hover:bg-yellow-300 transition-colors"
                  title="대표사진으로"
                >
                  <Star className="w-2.5 h-2.5 text-yellow-900" />
                  <span className="text-[9px] font-bold text-yellow-900">대표</span>
                </button>
                <button
                  onClick={() => handleDelete(photo.id)}
                  disabled={isBusy}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-red-500/90 hover:bg-red-400 transition-colors"
                  title="삭제"
                >
                  <Trash2 className="w-2.5 h-2.5 text-white" />
                  <span className="text-[9px] font-bold text-white">삭제</span>
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* 업로드 슬롯 */}
      {canUpload && (
        <button
          onClick={() => !isBusy && fileInputRef.current?.click()}
          disabled={isBusy}
          className={`w-16 h-16 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-0.5 transition-all flex-shrink-0 ${
            uploading
              ? "border-primary/50 bg-primary/5"
              : "border-border/60 bg-muted/40 hover:border-primary/50 hover:bg-primary/5 disabled:opacity-40 disabled:cursor-not-allowed"
          }`}
        >
          {uploading ? (
            <>
              <Spinner className="w-4 h-4 text-primary" />
              <span className="text-[9px] text-primary font-medium">업로드중</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground font-medium">
                {photos.length}/{MAX_EXTRA}
              </span>
            </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  );
}
