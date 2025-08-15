import { useEffect, useRef, useState } from "react";
import { getTechTagsTop5 } from "@/api/statistics.api";
import type { TechTagStat } from "@/types/statistics.model";
import {
  makeDebugTechTags,
  mergeTechTagStats,
  toBubbleData,
} from "@/utils/techTags";

type BubbleDatum = { label: string; count: number; color: string };

export function useTechTagsTop5() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bubbleData, setBubbleData] = useState<BubbleDatum[]>([]);
  const reqIdRef = useRef(0);

  useEffect(() => {
    let alive = true;
    const myReqId = ++reqIdRef.current;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = (await getTechTagsTop5()) ?? []; // [] 가능
        const debug = (
          localStorage.getItem("debug.techTags") || ""
        ).toLowerCase();
        let cfg: any = {};
        try {
          cfg = JSON.parse(localStorage.getItem("debug.techTags.cfg") || "{}");
        } catch {
          cfg = {};
        }
        const rawLen = (cfg ?? {}).len;
        const len =
          typeof rawLen === "number"
            ? rawLen
            : Number.isFinite(Number.parseInt(rawLen, 10))
            ? Number.parseInt(rawLen, 10)
            : undefined;
        const dummy = makeDebugTechTags(len);

        const effective: TechTagStat[] =
          debug === "replace"
            ? dummy
            : debug === "merge"
            ? mergeTechTagStats(res, dummy)
            : res;

        // 안전 합산 한번 더(혹시 서버 중복 포함), Top5 + 색 할당
        const merged = mergeTechTagStats(effective, []);
        const bubbles = toBubbleData(merged);

        if (alive && reqIdRef.current === myReqId) {
          setBubbleData(bubbles);
        }
      } catch (e: any) {
        if (alive && reqIdRef.current === myReqId) {
          setError(e?.message ?? "기술 태그 통계 조회 실패");
        }
      } finally {
        if (alive && reqIdRef.current === myReqId) {
          setLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    }; // 소프트 캔슬
  }, []);

  return { loading, error, bubbleData };
}
