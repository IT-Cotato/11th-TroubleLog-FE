/**
 * 별점 enum/문자 → 숫자 변환
 * API 응답(ONE_STAR, TWO_STARS 등) 및 단축 문자열(ONE, TWO 등) 지원
 */
export function parseStar(raw: unknown): number {
  if (typeof raw === "number") return raw;
  if (typeof raw !== "string") return 0;
  const k = raw.toUpperCase();
  const map: Record<string, number> = {
    ONE_STAR: 1,
    TWO_STARS: 2,
    THREE_STARS: 3,
    FOUR_STARS: 4,
    FIVE_STARS: 5,
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
    NONE: 0,
  };
  return map[k] ?? 0;
}
