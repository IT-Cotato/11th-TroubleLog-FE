import { type PropsWithChildren, useEffect, useRef } from "react";
import { connectAlertSSE } from "@/api/alert.api";
import { useIsLoggedIn, useViewerId, useAuthStore } from "@/store/auth";
import api from "@/api/axios";
import { useNotificationStore } from "@/store/notification";
import type { AlertServerItem } from "@/types/alert.model";
import { useLocation } from "react-router-dom";
import { PATH } from "@/constants/paths";

// 콜백 라우트 감지 (팝업/직접접속 모두)
const isAuthCallbackPath = (p: string) =>
  p.startsWith(PATH.OAUTH_REGISTER) || p.startsWith(PATH.OAUTH_POPUP);

async function tryRefreshOnce() {
  try {
    await api.post(
      "/auth/refresh",
      undefined,
      { __skipGlobalAuthGuard: true, __skipGlobal404: true } // 전역 가드/404 네비게이션 방지
    );
    return true;
  } catch {
    return false;
  }
}

function isAlertPayload(x: any): x is AlertServerItem {
  return x && typeof x === "object" && "title" in x && "message" in x;
}

export default function AlertSSEProvider({ children }: PropsWithChildren) {
  const isLoggedIn = useIsLoggedIn();
  const viewerId = useViewerId();
  const hydrated = (useAuthStore as any).persist?.hasHydrated?.() ?? true;
  const { pathname } = useLocation();

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

    // OAuth 콜백 라우트에서는 SSE/리프레시 로직 전부 비활성화
    if (isAuthCallbackPath(pathname)) {
      // 정리만 하고 즉시 반환
      stopRef.current = true;
      esCloseRef.current?.();
      esCloseRef.current = null;
      connectedRef.current = false;
      prevViewerRef.current = null;
      if (connectTimerRef.current != null) {
        clearTimeout(connectTimerRef.current);
        connectTimerRef.current = null;
      }
      if (import.meta.env.DEV) {
        console.debug("[SSE] skipped on auth callback:", pathname);
      }
      return;
    }

    const token = localStorage.getItem("accessToken") ?? "";
    if (!isLoggedIn || !token) {
      stopRef.current = true;
      esCloseRef.current?.();
      esCloseRef.current = null;
      connectedRef.current = false;
      prevViewerRef.current = null;
      if (connectTimerRef.current != null) {
        clearTimeout(connectTimerRef.current);
        connectTimerRef.current = null;
      }
      return;
    }

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
          onMessage: (payload) => {
            if (!isAlertPayload(payload)) return;
            useNotificationStore.getState().pushFromSSE(payload);
          },
          onError: (e) => console.warn("[SSE] error", e),
          onUnauthorized: async () => {
            // 콜백 라우트면 무시
            if (isAuthCallbackPath(window.location.pathname)) return;
            if (refreshingRef.current) return;
            refreshingRef.current = true;
            const ok = await tryRefreshOnce();
            refreshingRef.current = false;
            if (stopRef.current) return;
            if (!ok) return;
            esCloseRef.current?.();
            esCloseRef.current = null;
            connectedRef.current = false;
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

    connectTimerRef.current = window.setTimeout(start, 0);

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
  }, [hydrated, isLoggedIn, viewerId, autoReconnect, retryMs, pathname]);

  return <>{children}</>;
}
