import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Viewer = {
  userId: number;
};

type AuthState = {
  user: Viewer | null;
  setUser: (u: Viewer) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (u) => set({ user: u }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: "auth", // localStorage 키(자동 저장)
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user }), // 필요한 것만 저장
    }
  )
);

// 컴포넌트에서 사용
export const useViewerId = () => useAuthStore((s) => s.user?.userId ?? null);

// 훅 못 쓰는 유틸/서비스 파일에서 사용
export const getViewerId = () => useAuthStore.getState().user?.userId ?? null;
