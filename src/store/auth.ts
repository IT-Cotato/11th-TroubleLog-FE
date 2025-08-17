import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Viewer = {
  userId: number;
};

type AuthState = {
  user: Viewer | null;
  hydrated: boolean;
  setUser: (u: Viewer) => void;
  clearUser: () => void;
  setHydrated: (v: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      hydrated: false,
      setUser: (u) => set({ user: u }),
      clearUser: () => set({ user: null }),
      setHydrated: (v) => set({ hydrated: v }),
    }),
    {
      name: "auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user }),
      onRehydrateStorage: () => (state) => {
        // rehydrate가 끝남을 표시
        state?.setHydrated(true);
      },
    }
  )
);

// 컴포넌트에서 사용
export const useViewerId = () => useAuthStore((s) => s.user?.userId ?? null);
export const useIsLoggedIn = () => useAuthStore((s) => s.user !== null);
export const useAuthHydrated = () => useAuthStore((s) => s.hydrated);

// 훅 못 쓰는 유틸/서비스 파일에서 사용
export const getViewerId = () => useAuthStore.getState().user?.userId ?? null;
export const getIsLoggedIn = () => useAuthStore.getState().user !== null;
