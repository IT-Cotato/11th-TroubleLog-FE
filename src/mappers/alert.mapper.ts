import type { AlertServerItem } from "@/types/alert.model";

export type TabType = "전체" | "트러블슈팅" | "댓글" | "좋아요";

export interface NotificationItem {
  id: number;
  type: TabType;
  text: string;
  link?: string;
  isRead?: boolean;
  title?: string;
}

// 서버 라벨(ko) -> 탭
export function guessTabFromLabel(label?: string): TabType {
  if (!label) return "전체";
  if (label.includes("댓글")) return "댓글";
  if (label.includes("좋아요")) return "좋아요";
  if (label.includes("트러블") || label.includes("문서")) return "트러블슈팅";
  return "전체";
}

export function toNotificationItem(
  s: AlertServerItem,
  fallbackTab: TabType = "전체"
): NotificationItem {
  return {
    id: s.alertId,
    type: guessTabFromLabel(s.alertType) || fallbackTab,
    text: s.message ?? s.title ?? "",
    isRead: s.isRead,
    title: s.title,
    link: s.targetUrl ?? undefined,
  };
}
