import { useEffect, useRef, useState } from "react";
import { deleteAlert, getAlerts, connectAlertSSE } from "@/api/alert.api";
import {
  toNotificationItem,
  type NotificationItem,
  type TabType,
} from "@/mappers/alert.mapper";
import type { AlertServerItem, AlertTypeParam } from "@/types/alert.model";

// 탭 -> 서버 쿼리 파라미터
const tabToParam = (tab: TabType): AlertTypeParam | undefined => {
  switch (tab) {
    case "댓글":
      return "comments";
    case "좋아요":
      return "likes";
    case "트러블슈팅":
      return "troubles";
    default:
      return undefined; // 전체
  }
};

export default function useNotifications(selected: TabType) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 최신 탭을 SSE에서 참조하기 위한 ref
  const selectedRef = useRef<TabType>(selected);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  // 목록 불러오기
  useEffect(() => {
    let dead = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const param = tabToParam(selected);
        const list = await getAlerts(param);
        if (dead) return;
        const mapped = (list ?? []).map((s) => toNotificationItem(s, selected));
        setItems(mapped);
      } catch (e: any) {
        if (!dead) setError(e?.message ?? "알림을 불러오지 못했습니다.");
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => {
      dead = true;
    };
  }, [selected]);

  // 삭제
  const removeOne = async (id: number) => {
    try {
      await deleteAlert(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      // 필요시 토스트로 교체
      alert(e?.message ?? "알림 삭제에 실패했습니다.");
    }
  };

  // SSE 연결 (mount 시 1회)
  useEffect(() => {
    // 토큰이 필요하면 localStorage 등에서 꺼내 쿼리로 전달
    const token = localStorage.getItem("accessToken");

    const close = connectAlertSSE({
      tokenParamName: token ? "token" : undefined, // 백엔드가 허용할 때만!
      tokenValue: token ?? undefined,
      onMessage: (payload) => {
        // 서버 이벤트 페이로드를 서버 스키마에 맞게 해석
        const sse = payload as Partial<AlertServerItem> | any;

        // 유효한 알림인지 체크
        if (!sse || typeof sse !== "object" || !("alertId" in sse)) return;

        // 현재 탭에서 보이는 항목만 prepend (전체면 무조건)
        const tab = selectedRef.current;
        const item = toNotificationItem(sse as AlertServerItem);
        const shouldShow =
          tab === "전체" || tab === item.type || tabToParam(tab) === undefined;

        setItems((prev) => (shouldShow ? [item, ...prev] : prev));
      },
      onError: () => {
        // 끊겨도 브라우저가 자동 재시도; 필요시 상태표시만
        // console.warn("SSE connection error", e);
      },
    });

    return close; // unmount 시 연결 해제
  }, []);

  return { items, loading, error, removeOne };
}
