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
      const ok =
        res.ok &&
        (res.headers.get("content-type") || "").startsWith("text/event-stream");
      if (!ok) {
        const err = new Error(`SSE open failed: ${res.status}`);
        h.onError?.(err);
        if (!autoReconnect) ctrl.abort();
        throw err;
      }
      h.onOpen?.();
      return;
    },

    onmessage(ev) {
      const d = ev.data;
      if (typeof d === "string" && d.startsWith(":")) return;
      try {
        h.onMessage?.(JSON.parse(d));
      } catch {
        h.onMessage?.(d);
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
