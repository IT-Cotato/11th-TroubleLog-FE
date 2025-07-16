import { create } from "zustand";
import type { StatusType } from "@/types/project";

type StatusFilter = StatusType | "all";

interface MyPageStore {
  selectedStatus: StatusFilter;
  setSelectedStatus: (status: StatusFilter) => void;
}

export const useMyPageStore = create<MyPageStore>((set) => ({
  selectedStatus: "all",
  setSelectedStatus: (status) => set({ selectedStatus: status }),
}));
