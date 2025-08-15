import type { DailyStat } from "@/types/statistics.model";

// 서울 기준 오늘 날짜(YYYY-MM-DD)
export function todaySeoul(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

// "YYYY-MM-DD" 형식에서 days 만큼 과거로 이동
function shiftDate(dateStr: string, days: number): string {
  // 00:00:00+09:00로 고정 파싱 → 오프바이원 방지
  const d = new Date(`${dateStr}T00:00:00+09:00`);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

// end 포함, 과거 n일 범위 날짜 배열(오름차순)
export function makeDateRange(end: string, days: number): string[] {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    out.push(shiftDate(end, i));
  }
  return out;
}

// 서버가 1회 이상만 내려줄 때를 대비해 누락 날짜를 0으로 메움
export function normalizeDailyStats(
  raw: DailyStat[] | undefined,
  rangeDays = 14,
  endDate = todaySeoul()
): DailyStat[] {
  const range = makeDateRange(endDate, rangeDays);
  const map = new Map<string, number>();
  range.forEach((d) => map.set(d, 0));

  (raw ?? []).forEach(({ date, count }) => {
    // 중복 날짜가 온다면 합산
    map.set(date, (map.get(date) ?? 0) + (count ?? 0));
  });

  return range.map((d) => ({ date: d, count: map.get(d) ?? 0 }));
}
