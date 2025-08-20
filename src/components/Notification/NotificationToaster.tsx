import { useEffect, useRef } from "react";
import { useNotificationStore } from "@/store/notification";
import { useNavigate } from "react-router-dom";

export default function NotificationToaster() {
  const toasts = useNotificationStore((s) => s.toasts);
  const popToast = useNotificationStore((s) => s.popToast);
  const navigate = useNavigate();
  const scheduledRef = useRef<Record<number, number>>({});

  useEffect(() => {
    for (const t of toasts) {
      if (scheduledRef.current[t.id]) continue;
      const tid = window.setTimeout(() => {
        popToast(t.id);
        delete scheduledRef.current[t.id];
      }, 2500);
      scheduledRef.current[t.id] = tid;
    }
    const liveIds = new Set(toasts.map((t) => t.id));
    for (const id in scheduledRef.current) {
      const num = Number(id);
      if (!liveIds.has(num)) {
        clearTimeout(scheduledRef.current[num]);
        delete scheduledRef.current[num];
      }
    }
    return () => {
      for (const id in scheduledRef.current) {
        clearTimeout(scheduledRef.current[Number(id)]);
      }
      scheduledRef.current = {} as Record<number, number>;
    };
  }, [toasts, popToast]);

  const handleClick = (link?: string) => {
    if (!link) return;
    try {
      const url = new URL(link);
      if (url.origin === window.location.origin)
        navigate(url.pathname + url.search + url.hash);
      else window.location.href = link;
    } catch {
      navigate(link);
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed z-[9999] left-1/2 -translate-x-1/2 bottom-[calc(2rem+env(safe-area-inset-bottom))] flex flex-col gap-2 px-2 w-full max-w-screen-sm">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => handleClick(t.link)}
          className="px-4 py-2 rounded-full bg-black/90 text-white shadow-card hover:bg-black transition text-left whitespace-normal break-words max-w-full"
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
