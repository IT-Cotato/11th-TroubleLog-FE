import { create } from "zustand";

interface SearchStore {
  placeholder: string;
  setPlaceholder: (text: string) => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  placeholder: "키워드나 태그 등의 검색어를 입력하세요.",
  setPlaceholder: (text) => set({ placeholder: text }),
}));
