import { create } from "zustand";
import type { StatusType } from "@/types/project";

type StatusFilter = StatusType | "all" | null;
type MenuType = "trouble" | "statistics" | "likes";

interface MyPageStore {
  selectedStatus: StatusFilter;
  setSelectedStatus: (status: StatusFilter) => void;
  resetSelectedStatus: () => void;

  selectedMenu: MenuType;
  setSelectedMenu: (menu: MenuType) => void;

  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  resetSelectedTag: () => void;
}

export const useMyPageStore = create<MyPageStore>((set) => ({
  selectedStatus: "all",
  setSelectedStatus: (status) => set({ selectedStatus: status }),
  resetSelectedStatus: () => set({ selectedStatus: "all" }),

  selectedMenu: "trouble",
  setSelectedMenu: (menu) => set({ selectedMenu: menu }),

  selectedTag: null,
  setSelectedTag: (tag) => set({ selectedTag: tag }),
  resetSelectedTag: () => set({ selectedTag: null }),
}));
