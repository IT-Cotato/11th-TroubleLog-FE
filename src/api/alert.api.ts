import type {
  AlertServerItem,
  AlertTypeParam,
  Handlers,
} from "@/types/alert.model";
import getAPIResponseData from "@/utils/getAPIResponseData";
import api from "./axios";
import { fetchEventSource } from "@microsoft/fetch-event-source";

const inflightAlerts = new Map<string, Promise<AlertServerItem[]>>();

// 알림 목록 조회
export async function getAlerts(alertType?: AlertTypeParam) {
  const key = `alerts:list:${alertType ?? "all"}`;
  if (!inflightAlerts.has(key)) {
    const p = getAPIResponseData<AlertServerItem[]>({
      url: "/alert/list",
      method: "GET",
      params: alertType ? { alertType } : {},
    }).finally(() => setTimeout(() => inflightAlerts.delete(key), 0));
    inflightAlerts.set(key, p);
  }
  return inflightAlerts.get(key)!;
}

// 알림 삭제
export async function deleteAlert(alertId: number) {
  await api.delete("/alert", { params: { alertId } });
}

// 공통 헤더 구성: Authorization + EnvType
function buildSSEHeaders(opts?: { token?: string; envType?: string }) {
  const token = opts?.token ?? localStorage.getItem("accessToken") ?? "";

  const envType =
    opts?.envType ??
    localStorage.getItem("EnvType") ??
    (import.meta as any)?.env?.VITE_ENV_TYPE ??
    "LOCAL";

  const headers: Record<string, string> = {
    Accept: "text/event-stream",
    EnvType: envType,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function normalizeAlert(x: any): AlertServerItem | null {
  if (!x) return null;
  // 흔한 래퍼 형태 풀기
  if (Array.isArray(x) && x.length) return normalizeAlert(x[0]);
  if (x.data) return normalizeAlert(x.data);
  if (x.alert) return normalizeAlert(x.alert);

  // 다양한 키 대응
  const title = x.title ?? x.alertTitle ?? x.notificationTitle ?? x.subject;
  const message = x.message ?? x.alertMessage ?? x.body ?? x.content;
  const targetUrl = x.targetUrl ?? x.link ?? x.url;

  if (typeof title === "string" && typeof message === "string") {
    return { title, message, targetUrl } as AlertServerItem;
  }
  return null;
}

// SSE 연결 (실시간 알림)
export function connectAlertSSE(
  h: Handlers = {},
  opts?: {
    token?: string;
    envType?: string;
    autoReconnect?: boolean;
    retryMs?: number;
  }
) {
  const { token, envType, autoReconnect = true } = opts ?? {};
  const ctrl = new AbortController();
  const headers = buildSSEHeaders({ token, envType });

  fetchEventSource("/api/alert/connect", {
    method: "GET",
    headers,
    credentials: "include",
    signal: ctrl.signal,
    openWhenHidden: true,

    async onopen(res) {
      // 302/401/403 등 비정상 상태는 즉시 중단
      if (!res.ok) {
        const status = res.status;
        if (status === 401 || status === 403 || status === 302) {
          h.onUnauthorized?.(status);
        } else {
          h.onError?.(new Error(`SSE open failed: ${status}`));
        }
        // 재연결 루프 차단
        ctrl.abort();
        throw new Error(`stop-retry:${status}`);
      }

      const ct = res.headers.get("content-type") || "";
      if (!ct.startsWith("text/event-stream")) {
        h.onError?.(new Error(`Bad Content-Type: ${ct}`));
        if (!autoReconnect) ctrl.abort();
        throw new Error(`bad-ctype:${ct}`);
      }
      h.onOpen?.();
    },

    onmessage(ev) {
      if (ev.event && ev.event !== "alert") return;
      const d = ev.data;
      if (typeof d === "string" && d.startsWith(":")) return;
      if (!d) return;

      try {
        const parsed = JSON.parse(d);
        const item = normalizeAlert(parsed);
        if (item) h.onMessage?.(item);
      } catch {
        // 비 JSON(환영 메시지 등)은 무시
      }
    },

    onerror(err) {
      h.onError?.(err);
      if (!autoReconnect) {
        ctrl.abort();
        return;
      }
    },
  });

  return () => ctrl.abort();
}
