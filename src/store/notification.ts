import { create } from "zustand";
import type { AlertServerItem } from "@/types/alert.model";

type Toast = { id: number; title: string; message: string; link?: string };

interface NotificationState {
  hasNew: boolean;
  toasts: Toast[];
  pushFromSSE: (a: AlertServerItem) => void;
  popToast: (id: number) => void;
  clearNew: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  hasNew: false,
  toasts: [],
  pushFromSSE: (a) =>
    set((s) => ({
      hasNew: true,
      toasts: [
        ...s.toasts,
        {
          id: Date.now(),
          title: a.title ?? "알림",
          message: a.message ?? "",
          link: a.targetUrl ?? undefined,
        },
      ],
    })),
  popToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clearNew: () => set(() => ({ hasNew: false })),
}));
