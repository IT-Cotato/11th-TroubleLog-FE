import { create } from "zustand";
import type { AlertServerItem } from "@/types/alert.model";

type Toast = { id: number; title: string; message: string; link?: string };

interface NotificationState {
  hasNew: boolean;
  toasts: Toast[];
  pushFromSSE: (a: AlertServerItem) => void;
  popToast: (id: number) => void;
  clearNew: () => void;

  hydrateUnread: (list: AlertServerItem[]) => void;
  pushMany: (list: AlertServerItem[]) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
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

  // 미확인 알림이 존재하면 hasNew = true, 그리고 토스트 요약/대표만 푸시
  hydrateUnread: (list) => {
    if (!list?.length) return;
    set({ hasNew: true });
    get().pushMany(list);
  },

  // 대표 2개 + 요약 1개(총 3개)만 큐잉
  pushMany: (list) => {
    if (!list?.length) return;
    const head = list.slice(0, 2);
    const rest = Math.max(0, list.length - head.length);

    const mapped: Toast[] = head.map((a, idx) => ({
      id: Number(`${Date.now()}${idx}`),
      title: a.title ?? "알림",
      message: a.message ?? "",
      link: a.targetUrl ?? undefined,
    }));

    if (rest > 0) {
      mapped.push({
        id: Number(`${Date.now()}99`),
        title: "미확인 알림",
        message: `${rest}개 더 있어요. 눌러서 확인하기`,
        link: `${window.location.pathname}?openNotif=1`,
      });
    }

    set((s) => ({ toasts: [...s.toasts, ...mapped] }));
  },
}));
