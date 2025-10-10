import { useEffect, useRef, useState } from "react";
import { getErrorTagTop3 } from "@/api/statistics.api";
import type { ErrorTagStat } from "@/types/statistics.model";
import { makeDebugErrorTags, mergeErrorTagStats } from "@/utils/errorTagStats";

export function useErrorTagsTop3() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [data, setData] = useState<number[]>([]);
  const reqIdRef = useRef(0);

  useEffect(() => {
    let alive = true;
    const myReqId = ++reqIdRef.current;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = (await getErrorTagTop3()) ?? []; // [] or 실제 배열
        // 디버그 플래그: localStorage.debug.errorTags = 'replace' | 'merge'
        const debug =
          typeof window !== "undefined"
            ? (localStorage.getItem("debug.errorTags") || "").toLowerCase()
            : "";
        const dummy = makeDebugErrorTags();

        let effective: ErrorTagStat[] =
          debug === "replace"
            ? dummy
            : debug === "merge"
            ? mergeErrorTagStats(res, dummy)
            : res;

        // 안전: 정렬 + Top3로 자르기
        effective = effective
          .slice()
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);

        if (alive && reqIdRef.current === myReqId) {
          setLabels(effective.map((x) => x.name));
          setData(effective.map((x) => x.count));
        }
      } catch (e: any) {
        if (alive && reqIdRef.current === myReqId) {
          setError(e?.message ?? "에러 태그 통계 조회 실패");
        }
      } finally {
        if (alive && reqIdRef.current === myReqId) {
          setLoading(false);
        }
      }
    })();

    return () => {
      alive = false; // 소프트 캔슬
    };
  }, []);

  return { loading, error, labels, data };
}
