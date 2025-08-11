// useTroubleCards.ts
import { useEffect, useMemo, useRef, useState } from "react";
import type { TroublogCardVM } from "@/mappers/troubleCard.mapper";
import { toTroublogCardVMs } from "@/mappers/troubleCard.mapper";
import { getTroubleList, getProjectTroubleList } from "@/api/trouble.api";

type Source = { type: "all" } | { type: "project"; projectId: number };

export default function useTroubleCards(source: Source) {
  const [cards, setCards] = useState<TroublogCardVM[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const key = source.type === "all" ? "all" : `project:${source.projectId}`;

  // 가장 최근 요청만 반영하기 위한 id
  const reqIdRef = useRef(0);

  const fetchByKey = useMemo(() => {
    return async (currentReqId: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const list =
          source.type === "all"
            ? await getTroubleList()
            : await getProjectTroubleList(source.projectId);
        // 최신 요청만 반영
        if (reqIdRef.current === currentReqId) {
          setCards(toTroublogCardVMs(list));
        }
      } catch (e: any) {
        if (reqIdRef.current === currentReqId) {
          setError(e?.message ?? "불러오기 실패");
        }
      } finally {
        if (reqIdRef.current === currentReqId) {
          setIsLoading(false);
        }
      }
    };
  }, [
    key,
    source.type,
    source.type === "project" ? source.projectId : undefined,
  ]);

  useEffect(() => {
    const myReqId = ++reqIdRef.current;
    fetchByKey(myReqId);
  }, [fetchByKey]);

  // 외부에서 강제 새로고침할 때
  const reload = () => {
    const myReqId = ++reqIdRef.current;
    return fetchByKey(myReqId);
  };

  return { cards, isLoading, error, reload };
}
