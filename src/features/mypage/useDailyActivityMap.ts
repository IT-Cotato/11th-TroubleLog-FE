import { getDailyActivity } from "@/api/statistics.api";
import {
  makeDebugDailyStats,
  mergeDailyStatsToYearMap,
} from "@/utils/activityMap";
import { useEffect, useRef, useState } from "react";

export function useDailyActivityMap(year = new Date().getFullYear()) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityMap, setActivityMap] = useState<Record<string, number>>({});

  // 최신 요청만 결과를 반영하기 위한 ID
  const reqIdRef = useRef(0);

  useEffect(() => {
    let alive = true;
    const myReqId = ++reqIdRef.current;

    // 매 실행마다 명시적으로 로딩 시작
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const stats = await getDailyActivity();

        // 디버그 모드: localStorage로 제어
        //   - "replace" : 서버 응답 무시하고 더미만 사용
        //   - "merge"   : 서버 응답 + 더미 합쳐서 사용
        //   - 그 외/없음 : 서버 응답만 사용
        const debugMode = (
          localStorage.getItem("debug.dailyActivity") || ""
        ).toLowerCase();
        const dummy = makeDebugDailyStats(year);

        let effective = stats ?? [];
        if (debugMode === "replace") {
          effective = dummy;
        } else if (debugMode === "merge") {
          effective = [...(stats ?? []), ...dummy];
        }

        const map = mergeDailyStatsToYearMap(effective, year);

        if (alive && reqIdRef.current === myReqId) {
          setActivityMap(map);
        }
      } catch (e: any) {
        // axios 취소이면 조용히 무시
        if (e?.code === "ERR_CANCELED") return;
        if (alive && reqIdRef.current === myReqId) {
          setError(e?.message ?? "통계 조회 실패");
        }
      } finally {
        if (alive && reqIdRef.current === myReqId) {
          setLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [year]);

  return { loading, error, activityMap };
}
