import { useEffect, useRef, useState } from "react";
import { deleteAlert, getAlerts } from "@/api/alert.api";
import {
  toNotificationItem,
  type NotificationItem,
  type TabType,
} from "@/mappers/alert.mapper";
import type { AlertTypeParam } from "@/types/alert.model";

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
      alert(e?.message ?? "알림 삭제에 실패했습니다.");
    }
  };

  return { items, loading, error, removeOne };
}
