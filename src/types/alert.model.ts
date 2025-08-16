export type AlertTypeParam = "comments" | "likes" | "troubles";

export interface AlertServerItem {
  alertId: number;
  title: string;
  message: string;
  alertType: string;
  isRead: boolean;
  userId: number;
}
