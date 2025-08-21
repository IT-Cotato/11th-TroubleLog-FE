import { type PropsWithChildren, useEffect, useRef } from "react";
import { connectAlertSSE } from "@/api/alert.api";
import { useIsLoggedIn, useViewerId, useAuthStore } from "@/store/auth";
import api from "@/api/axios";
import { useNotificationStore } from "@/store/notification";
import type { AlertServerItem } from "@/types/alert.model";
import { PATH } from "@/constants/paths";

// 콜백 라우트 감지(풀 리다이렉트 방식: /auth/oauth-register 만 스킵)
const isAuthCallbackPath = (p: string) => p.startsWith(PATH.OAUTH_REGISTER);

// 1회 리프레시(전역 가드/404 네비 방지 플래그 부여)
async function tryRefreshOnce() {
  try {
    await api.post("/auth/refresh", undefined, {
      __skipGlobalAuthGuard: true,
      __skipGlobal404: true,
    });
    return true;
  } catch {
    return false;
  }
}

// 타입 가드
function isAlertPayload(x: any): x is AlertServerItem {
  return x && typeof x === "object" && "title" in x && "message" in x;
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

    // ✅ OAuth 콜백 라우트에서는 SSE/리프레시 전부 비활성화
    const pathname = window.location.pathname;
    if (isAuthCallbackPath(pathname)) {
      stopRef.current = true;
      esCloseRef.current?.();
      esCloseRef.current = null;
      connectedRef.current = false;
      prevViewerRef.current = null;
      if (connectTimerRef.current != null) {
        clearTimeout(connectTimerRef.current);
        connectTimerRef.current = null;
      }
      if (import.meta.env.DEV)
        console.debug("[SSE] skipped on auth callback:", pathname);
      return;
    }

    // 로그인 전에는 연결 시도 안 함
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

    // StrictMode 중복 연결 방지: 0ms 지연으로 예약
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
  }, [hydrated, isLoggedIn, viewerId, autoReconnect, retryMs]);

  return <>{children}</>;
}
