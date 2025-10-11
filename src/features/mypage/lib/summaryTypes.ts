import type { SummaryTypeStat } from "@/types/statistics.model";

const CANDIDATES = ["자기소개서", "면접대비", "블로그", "이슈관리"];

export function makeDebugSummaryTypes(): SummaryTypeStat[] {
  // 2~4개 랜덤 선택 + 랜덤 카운트
  const n = 2 + Math.floor(Math.random() * 3);
  const picked = [...CANDIDATES].sort(() => Math.random() - 0.5).slice(0, n);
  return picked.map((name, i) => ({
    name,
    count: 2 + Math.floor(Math.random() * (10 - i)),
  }));
}

export function mergeSummaryTypeStats(
  a: SummaryTypeStat[],
  b: SummaryTypeStat[]
): SummaryTypeStat[] {
  const map = new Map<string, number>();
  [...a, ...b].forEach(({ name, count }) => {
    map.set(name, (map.get(name) ?? 0) + (count ?? 0));
  });
  return [...map.entries()].map(([name, count]) => ({ name, count }));
}
