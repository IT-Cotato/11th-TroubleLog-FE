import type { ErrorTagStat } from "@/types/statistics.model";

// 디버그용 더미(랜덤)
export function makeDebugErrorTags(): ErrorTagStat[] {
  const pool = [
    "빌드 오류",
    "네트워크",
    "상태관리",
    "타입스크립트",
    "의존성/버전",
    "렌더링 성능",
  ];
  const n = 3 + Math.floor(Math.random() * 3); // 3~5개
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, n);
  return shuffled.map((name, i) => ({
    name,
    count: 2 + Math.floor(Math.random() * (10 - i * 2)),
  }));
}

// 동일 name끼리 count 합산
export function mergeErrorTagStats(
  a: ErrorTagStat[],
  b: ErrorTagStat[]
): ErrorTagStat[] {
  const map = new Map<string, number>();
  for (const x of [...a, ...b]) {
    map.set(x.name, (map.get(x.name) ?? 0) + (x.count ?? 0));
  }
  return [...map.entries()].map(([name, count]) => ({ name, count }));
}
