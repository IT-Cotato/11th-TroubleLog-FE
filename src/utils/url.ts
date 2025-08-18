export const toInternalSpaPath = (input?: string | null): string | null => {
  if (!input) return null;

  // 이미 내부 경로라면 그대로
  if (input.startsWith("/") || input.startsWith("?") || input.startsWith("#")) {
    return input;
  }

  // 위험 스킴 차단
  if (/^[a-z][a-z0-9+.-]*:/i.test(input)) {
    try {
      const u = new URL(input);
      if (u.protocol !== "http:" && u.protocol !== "https:") return null;
      return u.pathname + u.search + u.hash; // http/https 절대 URL → 경로만 사용
    } catch {
      return null;
    }
  }

  // 도메인 없는 상대 경로 → 내부 경로로 정규화
  return input.startsWith("/") ? input : `/${input}`;
};
