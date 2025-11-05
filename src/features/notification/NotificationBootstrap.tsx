import { useEffect, useRef } from "react";
import { getUnreadAlerts } from "@/api/alert.api";
import { useNotificationStore } from "@/store/notification";

export default function NotificationBootstrap() {
  const bootedRef = useRef(false);
  const hydrateUnread = useNotificationStore((s) => s.hydrateUnread);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    (async () => {
      try {
        // 전체 미확인 알림
        const unread = await getUnreadAlerts();
        // 0개면 아무 것도 안 함 (store 내부에서 가드함)
        hydrateUnread(unread);
      } catch {
        // 무시: 초기 진입 UX를 방해하지 않음
      }
    })();
  }, [hydrateUnread]);

  return null;
}
