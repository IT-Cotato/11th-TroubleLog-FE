import { create } from "zustand";

export interface SummaryCompletionPayload {
  postId: number;
  summaryId: number;
}

interface SummaryCompletionSnackbarState {
  /** 요약 완료 시 결과 페이지 이동용 payload (스낵바 표시 전까지 유지) */
  pending: SummaryCompletionPayload | null;
  offer: (p: SummaryCompletionPayload) => void;
  consume: () => void;
}

export const useSummaryCompletionSnackbarStore =
  create<SummaryCompletionSnackbarState>((set) => ({
    pending: null,
    offer: (p) => set({ pending: p }),
    consume: () => set({ pending: null }),
  }));
