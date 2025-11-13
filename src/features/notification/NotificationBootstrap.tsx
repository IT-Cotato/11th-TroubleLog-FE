import { useEffect, useRef } from "react";
import { getUnreadAlerts } from "@/api/alert.api";
import { useNotificationStore } from "@/store/notification";

function buildBootKey() {
  const token = localStorage.getItem("accessToken") ?? "";
  // 토큰이 바뀌면(재로그인) 키도 바뀌도록 토큰 뒷부분으로 구분
  const suffix = token ? token.slice(-16) : "no-token";
  return `notifBoot:v2:${suffix}`;
}

export default function NotificationBootstrap() {
  const bootedRef = useRef(false);
  const hydrateUnread = useNotificationStore((s) => s.hydrateUnread);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    const bootKey = buildBootKey();
    // 이미 이번 로그인 세션에서 한 번 알림을 보여줬다면 스킵
    if (sessionStorage.getItem(bootKey) === "1") return;

    (async () => {
      try {
        const unread = await getUnreadAlerts();
        if (unread && unread.length > 0) {
          hydrateUnread(unread); // 아이콘 표시 + 토스트(대표 2개 + 요약 1개)
          sessionStorage.setItem(bootKey, "1"); // 이번 세션에서는 다시 안 띄움
        } else {
          // sessionStorage.setItem(bootKey, "1");
        }
      } catch {
        // 초기 UX 방해하지 않음
      }
    })();
  }, [hydrateUnread]);

  return null;
}
