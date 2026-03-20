"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Plus, Trash2, Star } from "lucide-react";
import { apiClient } from "@/lib/api";
import { Gecko, GeckoPhoto } from "@/app/types/gecko";

const MAX_EXTRA = 3;

export default function GeckoPhotoGallery({
  gecko,
  onRefresh,
}: {
  gecko: Gecko;
  onRefresh?: () => void;
}) {
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<number | null>(null);

  const photos: GeckoPhoto[] = gecko.photos ?? [];
  const canUpload = photos.length < MAX_EXTRA;

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
    }
  };

  return (
    <div className="flex gap-2 mt-3">
      {/* 추가 사진 썸네일 */}
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="relative group w-16 h-16 rounded-xl overflow-hidden border-2 border-border/50 bg-muted flex-shrink-0 cursor-pointer hover:border-primary/60 transition-all"
        >
          <Image
            src={photo.image}
            alt="추가 사진"
            fill
            className="object-cover"
            unoptimized
          />
          {/* hover 오버레이 */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
            <button
              onClick={() => handleSetPrimary(photo.id)}
              disabled={settingPrimaryId === photo.id}
              className="p-1 rounded-full bg-white/20 hover:bg-yellow-400/80 transition-colors"
              title="대표사진으로 설정"
            >
              <Star className="w-3 h-3 text-white" />
            </button>
            <button
              onClick={() => handleDelete(photo.id)}
              disabled={deletingId === photo.id}
              className="p-1 rounded-full bg-white/20 hover:bg-red-500/80 transition-colors"
              title="삭제"
            >
              <Trash2 className="w-3 h-3 text-white" />
            </button>
          </div>
        </div>
      ))}

      {/* 업로드 슬롯 */}
      {canUpload && (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-16 h-16 rounded-xl border-2 border-dashed border-border/60 bg-muted/40 flex flex-col items-center justify-center gap-0.5 hover:border-primary/50 hover:bg-primary/5 transition-all flex-shrink-0 disabled:opacity-50"
          title="사진 추가"
        >
          {uploading ? (
            <span className="text-[10px] text-muted-foreground">업로드중</span>
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
