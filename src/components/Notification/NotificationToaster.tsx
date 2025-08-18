// components/Notification/NotificationToaster.tsx
import { useEffect, useRef } from "react";
import { useNotificationStore } from "@/store/notification";
import { useNavigate } from "react-router-dom";

export default function NotificationToaster() {
  const toasts = useNotificationStore((s) => s.toasts);
  const popToast = useNotificationStore((s) => s.popToast);
  const navigate = useNavigate();

  // 이미 예약된 타이머 중복 방지 (리렌더 시 중복 등록을 막기 위해)
  const scheduledRef = useRef<Record<number, number>>({});

  useEffect(() => {
    // 새로 생긴 토스트만 타이머 등록
    for (const t of toasts) {
      if (scheduledRef.current[t.id]) continue;
      const tid = window.setTimeout(() => {
        popToast(t.id);
        delete scheduledRef.current[t.id];
      }, 2500);
      scheduledRef.current[t.id] = tid;
    }

    // 사라진 토스트의 타이머 정리
    const liveIds = new Set(toasts.map((t) => t.id));
    for (const id in scheduledRef.current) {
      const num = Number(id);
      if (!liveIds.has(num)) {
        clearTimeout(scheduledRef.current[num]);
        delete scheduledRef.current[num];
      }
    }

    // 언마운트 안전 장치
    return () => {
      for (const id in scheduledRef.current) {
        clearTimeout(scheduledRef.current[Number(id)]);
      }
      scheduledRef.current = {};
    };
  }, [toasts, popToast]);

  const handleClick = (link?: string) => {
    if (!link) return;
    try {
      const url = new URL(link);
      if (url.origin === window.location.origin) {
        navigate(url.pathname + url.search + url.hash);
      } else {
        window.location.href = link;
      }
    } catch {
      // 절대 URL이 아니면 내부 경로로 가정
      navigate(link);
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => handleClick(t.link)}
          className="px-4 py-2 rounded-full bg-black/90 text-white shadow-card hover:bg-black transition"
          title={t.title}
        >
          <span className="font-semibold">{t.title}</span>
          <span className="mx-2">·</span>
          <span>{t.message}</span>
        </button>
      ))}
    </div>
  );
}
