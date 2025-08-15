import { useEffect, useRef, useState } from "react";
import { getSummaryTypes } from "@/api/statistics.api";
import type { SummaryTypeStat } from "@/types/statistics.model";
import {
  makeDebugSummaryTypes,
  mergeSummaryTypeStats,
} from "@/utils/summaryTypes";

type SummaryDatum = { label: string; value: number };

export function useSummaryTypes() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryDatum[]>([]);
  const reqIdRef = useRef(0);

  useEffect(() => {
    let alive = true;
    const myReqId = ++reqIdRef.current;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = (await getSummaryTypes()) ?? []; // [] 가능
        const debug = (
          localStorage.getItem("debug.summaryTypes") || ""
        ).toLowerCase();
        const dummy = makeDebugSummaryTypes();

        const effective: SummaryTypeStat[] =
          debug === "replace"
            ? dummy
            : debug === "merge"
            ? mergeSummaryTypeStats(res, dummy)
            : res;

        // 이름 중복 합산(안전), 값 내림차순 정렬
        const merged = mergeSummaryTypeStats(effective, []);
        merged.sort((a, b) => b.count - a.count);

        const chartData: SummaryDatum[] = merged.map(({ name, count }) => ({
          label: name,
          value: count,
        }));

        if (alive && reqIdRef.current === myReqId) setSummaryData(chartData);
      } catch (e: any) {
        if (alive && reqIdRef.current === myReqId) {
          setError(e?.message ?? "요약본 통계 조회 실패");
        }
      } finally {
        if (alive && reqIdRef.current === myReqId) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    }; // 소프트 캔슬
  }, []);

  return { loading, error, summaryData };
}
