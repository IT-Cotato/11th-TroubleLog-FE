import type { TechTagStat } from "@/types/statistics.model";

const PALETTE = ["#9C4FFF", "#FFDC69", "#D5A7FF", "#FFEFB0", "#E8C6FF"];

export function makeDebugTechTags(len?: number): TechTagStat[] {
  const pool = [
    "React",
    "TypeScript",
    "Flutter",
    "GetX",
    "Zustand",
    "Axios",
    "Vite",
    "Tailwind",
    "Node.js",
    "NestJS",
    "AWS",
  ];
  const n = len ?? 5 + Math.floor(Math.random() * 3); // 기본 5~7개
  const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, n);
  return picked.map((name, i) => ({
    name,
    count: 6 + Math.floor(Math.random() * (28 - i * 3)),
  }));
}

// 동일 name을 합산
export function mergeTechTagStats(
  a: TechTagStat[],
  b: TechTagStat[]
): TechTagStat[] {
  const m = new Map<string, number>();
  for (const x of [...a, ...b]) {
    m.set(x.name, (m.get(x.name) ?? 0) + (x.count ?? 0));
  }
  return [...m.entries()].map(([name, count]) => ({ name, count }));
}

// 차트 props로 변환 + Top5 보정 + 색 부여
export function toBubbleData(stats: TechTagStat[]) {
  const sorted = stats
    .slice()
    .sort((x, y) => y.count - x.count)
    .slice(0, 5);
  return sorted.map((s, i) => ({
    label: s.name,
    count: s.count,
    color: PALETTE[i % PALETTE.length],
  }));
}
