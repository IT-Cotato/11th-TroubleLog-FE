import type { AlertServerItem, AlertTypeParam } from "@/types/alert.model";
import getAPIResponseData from "@/utils/getAPIResponseData";
import api from "./axios";

// 알림 목록 조회
export async function getAlerts(alertType?: AlertTypeParam) {
  return getAPIResponseData<AlertServerItem[]>({
    url: "/alert/list",
    method: "GET",
    params: alertType ? { alertType } : {},
  });
}

// 알림 삭제
export async function deleteAlert(alertId: number) {
  await api.delete("/alert", { params: { alertId } });
}

// SSE 연결 (실시간 알림)
export function connectAlertSSE(opts: {
  tokenParamName?: string; // 서버가 허용한다면 쿼리로 토큰 전달
  tokenValue?: string | null;
  onMessage?: (payload: unknown) => void;
  onOpen?: (e: Event) => void;
  onError?: (e: Event) => void;
}) {
  const { tokenParamName, tokenValue, onMessage, onOpen, onError } = opts || {};

  // axios baseURL 고려 (same origin 아닐 때 절대경로)
  const base = (api.defaults.baseURL ?? "").replace(/\/+$/, "");
  const path = "/alert/connect";
  const qs =
    tokenParamName && tokenValue
      ? `?${encodeURIComponent(tokenParamName)}=${encodeURIComponent(
          tokenValue
        )}`
      : "";
  const url = base ? `${base}${path}${qs}` : `${path}${qs}`;

  const es = new EventSource(url, { withCredentials: true });

  es.onopen = (e) => onOpen?.(e);
  es.onerror = (e) => onError?.(e);
  es.onmessage = (evt) => {
    // 서버가 {"timeout":0} 같은 keep-alive를 주면 파싱 후 필터링
    try {
      const data = JSON.parse(evt.data);
      // timeout 패킷 등은 무시
      if (data && typeof data === "object" && "timeout" in data) return;
      onMessage?.(data);
    } catch {
      // JSON이 아니면 원문 전달 (필요시 파싱 로직 확장)
      onMessage?.(evt.data);
    }
  };

  // 정리 함수 반환
  return () => es.close();
}
