import {
  eachDayOfInterval,
  startOfYear,
  endOfYear,
  format,
  isAfter,
} from "date-fns";
import type { DailyStat } from "@/types/statistics.model";

// 현재 연도에 랜덤 활동을 심는 디버그용 더미
export function makeDebugDailyStats(
  year = new Date().getFullYear(),
  density = 0.45 // 활동 있는 날 비율
): DailyStat[] {
  const start = startOfYear(new Date(year, 0, 1));
  const end = endOfYear(new Date(year, 11, 31));
  const today = new Date();
  const endClamp = isAfter(end, today) ? today : end;

  const days = eachDayOfInterval({ start, end: endClamp });
  const out: DailyStat[] = [];

  for (const d of days) {
    // density 확률로 활동 발생, count는 1~4 랜덤
    if (Math.random() < density) {
      out.push({
        date: format(d, "yyyy-MM-dd"),
        count: 1 + Math.floor(Math.random() * 4),
      });
    }
  }

  return out;
}

// 특정 연도 전체 날짜 키 맵을 0으로 채워서 생성
export function buildYearZeroMap(
  year = new Date().getFullYear()
): Record<string, number> {
  const start = startOfYear(new Date(year, 0, 1));
  const end = endOfYear(new Date(year, 11, 31));
  const days = eachDayOfInterval({ start, end });

  const map: Record<string, number> = {};
  for (const d of days) {
    const key = format(d, "yyyy-MM-dd"); // 로컬(KST) 기준
    map[key] = 0;
  }
  return map;
}

// 서버 응답을 연간 0맵에 덮어씌움 (중복 날짜는 합산 처리)
export function mergeDailyStatsToYearMap(
  stats: DailyStat[] | null | undefined,
  year = new Date().getFullYear()
): Record<string, number> {
  const map = buildYearZeroMap(year);
  if (!stats || stats.length === 0) return map;

  for (const { date, count } of stats) {
    // 응답에 범위 밖(다른 연도) 날짜가 섞여 올 수 있으니 필터
    if (date.startsWith(String(year))) {
      map[date] = (map[date] ?? 0) + (count ?? 0);
    }
  }
  return map;
}
