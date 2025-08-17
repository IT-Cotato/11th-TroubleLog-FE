export type AlertTypeParam = "comments" | "likes" | "troubles";

export type Handlers = {
  onOpen?: () => void;
  onMessage?: (data: any) => void;
  onError?: (err: any) => void;
  onUnauthorized?: (status: number) => void;
};

export interface AlertServerItem {
  alertId: number;
  title: string;
  message: string;
  alertType: string;
  isRead: boolean;
  userId: number;
}
