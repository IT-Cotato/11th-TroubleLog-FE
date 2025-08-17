import { type PropsWithChildren, useEffect, useRef } from "react";
import { connectAlertSSE } from "@/api/alert.api";
import { useIsLoggedIn, useViewerId, useAuthStore } from "@/store/auth";
import api from "@/api/axios";

async function tryRefreshOnce() {
  try {
    await api.get("/auth/refresh");
    return true;
  } catch {
    return false;
  }
}

export default function AlertSSEProvider({ children }: PropsWithChildren) {
  const isLoggedIn = useIsLoggedIn();
  const viewerId = useViewerId();
  const hydrated = (useAuthStore as any).persist?.hasHydrated?.() ?? true;

  const esCloseRef = useRef<null | (() => void)>(null);
  const connectedRef = useRef(false);
  const stopRef = useRef(false);
  const prevViewerRef = useRef<number | null>(null);
  const connectTimerRef = useRef<number | null>(null);
  const refreshingRef = useRef(false);

  const autoReconnect = true;
  const retryMs = Number(import.meta.env.VITE_SSE_RETRY_MS ?? 3000);

  useEffect(() => {
    if (!hydrated) return;

    const token = localStorage.getItem("accessToken") ?? "";
    if (!isLoggedIn || !token) {
      stopRef.current = true;
      esCloseRef.current?.();
      esCloseRef.current = null;
      connectedRef.current = false;
      prevViewerRef.current = null;
      // 예약된 연결 시도도 취소
      if (connectTimerRef.current != null) {
        clearTimeout(connectTimerRef.current);
        connectTimerRef.current = null;
      }
      return;
    }

    // 계정 전환 시 재연결
    if (connectedRef.current && prevViewerRef.current !== viewerId) {
      esCloseRef.current?.();
      esCloseRef.current = null;
      connectedRef.current = false;
    }

    if (connectedRef.current) return;

    stopRef.current = false;
    prevViewerRef.current = viewerId ?? null;

    const start = () => {
      const curToken = localStorage.getItem("accessToken") ?? "";
      const envType =
        localStorage.getItem("EnvType") ??
        (import.meta as any)?.env?.VITE_ENV_TYPE ??
        "LOCAL";

      const close = connectAlertSSE(
        {
          onOpen: () => console.log("[SSE] connected"),
          onMessage: () => {
            // TODO: 알림 스토어 반영
          },
          onError: (e) => console.warn("[SSE] error", e),
          onUnauthorized: async () => {
            // 401/403/302 → 재연결 루프 STOP 후 토큰 갱신 1회 시도
            if (refreshingRef.current) return;
            refreshingRef.current = true;

            const ok = await tryRefreshOnce();
            refreshingRef.current = false;

            if (stopRef.current) return;
            if (!ok) {
              // 갱신 실패 → 연결 유지하지 않음 (사용자가 재로그인하면 effect가 다시 트리거)
              return;
            }
            // 갱신 성공 → 새 토큰으로 재연결
            esCloseRef.current?.();
            esCloseRef.current = null;
            connectedRef.current = false;
            // 약간의 딜레이 후 재시도(토큰 저장/동기화 여유)
            connectTimerRef.current = window.setTimeout(start, 200);
          },
        },
        { token: curToken, envType, autoReconnect, retryMs }
      );

      esCloseRef.current = () => {
        close();
        connectedRef.current = false;
      };
      connectedRef.current = true;
    };

    // StrictMode 2회 실행 방지: 첫 사이클은 예약-즉시-해제되어 네트워크 요청 X
    connectTimerRef.current = window.setTimeout(start, 0);

    // 포커스/온라인 복귀 시 재연결 보조 (dev에서도 활성화)
    const onFocusOrOnline = () => {
      if (stopRef.current) return;
      if (!connectedRef.current) {
        esCloseRef.current?.();
        esCloseRef.current = null;
        start();
      }
    };
    const onBeforeUnload = () => esCloseRef.current?.();

    window.addEventListener("focus", onFocusOrOnline);
    window.addEventListener("online", onFocusOrOnline);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      stopRef.current = true;

      if (connectTimerRef.current != null) {
        clearTimeout(connectTimerRef.current);
        connectTimerRef.current = null;
      }

      window.removeEventListener("focus", onFocusOrOnline);
      window.removeEventListener("online", onFocusOrOnline);
      window.removeEventListener("beforeunload", onBeforeUnload);

      esCloseRef.current?.();
      esCloseRef.current = null;
      connectedRef.current = false;
    };
  }, [hydrated, isLoggedIn, viewerId, autoReconnect, retryMs]);

  return <>{children}</>;
}
