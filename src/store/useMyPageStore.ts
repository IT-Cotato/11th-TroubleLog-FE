import { create } from "zustand";
import type { StatusType } from "@/types/project";

type StatusFilter = StatusType | "all" | null;
type MenuType = "trouble" | "statistics" | "likes";

interface MyPageStore {
  selectedStatus: StatusFilter;
  setSelectedStatus: (status: StatusFilter) => void;

  selectedMenu: MenuType;
  setSelectedMenu: (menu: MenuType) => void;

  resetSelectedStatus: () => void;
}

export const useMyPageStore = create<MyPageStore>((set) => ({
  selectedStatus: "all",
  setSelectedStatus: (status) => set({ selectedStatus: status }),

  selectedMenu: "trouble",
  setSelectedMenu: (menu) => set({ selectedMenu: menu }),

  resetSelectedStatus: () => set({ selectedStatus: null }),
}));
