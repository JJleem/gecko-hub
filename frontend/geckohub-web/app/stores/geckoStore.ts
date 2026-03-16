import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Gecko } from "@/app/types/gecko";

const STALE_MS = 3 * 60 * 1000; // 3분

interface GeckoStore {
  geckos: Gecko[];
  lastFetched: number | null;
  isStale: () => boolean;
  setGeckos: (geckos: Gecko[]) => void;
  updateGecko: (gecko: Gecko) => void;
  removeGecko: (id: number) => void;
  clear: () => void;
}

export const useGeckoStore = create<GeckoStore>()(
  persist(
    (set, get) => ({
      geckos: [],
      lastFetched: null,

      isStale: () => {
        const { lastFetched } = get();
        if (!lastFetched) return true;
        return Date.now() - lastFetched > STALE_MS;
      },

      setGeckos: (geckos) => set({ geckos, lastFetched: Date.now() }),

      updateGecko: (updated) =>
        set((s) => ({
          geckos: s.geckos.map((g) => (g.id === updated.id ? updated : g)),
        })),

      removeGecko: (id) =>
        set((s) => ({
          geckos: s.geckos.filter((g) => g.id !== id),
          lastFetched: null,
        })),

      clear: () => set({ geckos: [], lastFetched: null }),
    }),
    {
      name: "gecko-store", // localStorage key
    }
  )
);
