import { create } from "zustand";
import type { StatusType } from "@/types/project";

type StatusFilter = StatusType | "all" | null;
type ViewedUser = { id: number | null; nickname: string | null };

interface MyPageStore {
  selectedStatus: StatusFilter;
  setSelectedStatus: (status: StatusFilter) => void;
  resetSelectedStatus: () => void;

  viewedUser: ViewedUser;
  setViewedUser: (payload: ViewedUser) => void;
  resetViewedUser: () => void;

  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  resetSelectedTag: () => void;
}

export const useMyPageStore = create<MyPageStore>((set) => ({
  selectedStatus: "all",
  setSelectedStatus: (status) => set({ selectedStatus: status }),
  resetSelectedStatus: () => set({ selectedStatus: "all" }),

  viewedUser: { id: null, nickname: null },
  setViewedUser: (payload) => set({ viewedUser: payload }),
  resetViewedUser: () => set({ viewedUser: { id: null, nickname: null } }),

  selectedTag: null,
  setSelectedTag: (tag) => set({ selectedTag: tag }),
  resetSelectedTag: () => set({ selectedTag: null }),
}));
