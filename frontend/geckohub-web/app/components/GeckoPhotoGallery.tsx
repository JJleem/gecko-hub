"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Plus, Trash2, Star, Loader2, X, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const lightboxCloseRef = useRef<HTMLButtonElement>(null);

  const photos: GeckoPhoto[] = gecko.photos ?? [];

  // 라이트박스 키보드 핸들러 + 포커스 이동
  useEffect(() => {
    if (lightboxIdx === null) return;
    // 열릴 때 닫기 버튼으로 포커스 이동
    lightboxCloseRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowLeft") setLightboxIdx((p) => (p !== null && p > 0 ? p - 1 : p));
      if (e.key === "ArrowRight") setLightboxIdx((p) => (p !== null && p < photos.length - 1 ? p + 1 : p));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIdx, photos.length]);
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
      {photos.map((photo, index) => {
        const isDeleting = deletingId === photo.id;
        const isSettingPrimary = settingPrimaryId === photo.id;
        const isThisBusy = isDeleting || isSettingPrimary;

        return (
          <div
            key={photo.id}
            className={`relative group w-16 h-16 rounded-xl overflow-hidden border-2 bg-muted flex-shrink-0 transition-all duration-200 ${
              isThisBusy
                ? "border-primary/60 scale-95 opacity-80"
                : "border-border/50 hover:border-primary/60"
            }`}
          >
            <button
              type="button"
              onClick={() => !isThisBusy && setLightboxIdx(index)}
              disabled={isThisBusy}
              aria-label={`사진 ${index + 1} 크게 보기`}
              className="absolute inset-0 w-full h-full cursor-zoom-in disabled:cursor-default focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            >
              <Image
                src={photo.image}
                alt={`${gecko.name} 사진 ${index + 1}`}
                fill
                className={`object-cover transition-all duration-300 ${isThisBusy ? "blur-[1px]" : ""}`}
                unoptimized
              />
            </button>

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

      {/* ── 라이트박스 ── */}
      {lightboxIdx !== null && photos[lightboxIdx] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${gecko.name} 사진 ${lightboxIdx + 1} / ${photos.length}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={() => setLightboxIdx(null)}
        >
          {/* 닫기 */}
          <button
            ref={lightboxCloseRef}
            type="button"
            onClick={() => setLightboxIdx(null)}
            aria-label="사진 닫기"
            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>

          {/* 이전 */}
          {lightboxIdx > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
              aria-label="이전 사진"
              className="absolute left-4 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronLeft className="w-6 h-6" aria-hidden="true" />
            </button>
          )}

          {/* 이미지 */}
          <div
            className="relative max-w-[90vw] max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[lightboxIdx].image}
              alt={`${gecko.name} 사진 ${lightboxIdx + 1}`}
              className="max-w-[90vw] max-h-[85vh] object-contain"
            />
          </div>

          {/* 다음 */}
          {lightboxIdx < photos.length - 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
              aria-label="다음 사진"
              className="absolute right-4 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronRight className="w-6 h-6" aria-hidden="true" />
            </button>
          )}

          {/* 인덱스 */}
          <div
            aria-live="polite"
            aria-atomic="true"
            className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/70 text-xs font-semibold bg-black/40 px-3 py-1.5 rounded-full"
          >
            {lightboxIdx + 1} / {photos.length}
          </div>
        </div>
      )}
    </div>
  );
}
