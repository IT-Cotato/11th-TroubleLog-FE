import { getTagsByKeyword } from "@/api/post.api";

/**
 * 태그 문자열 목록 → API로 정규화된 태그 목록 (TempWrite/FreeFormWrite 공통)
 * # 접두사 제거, 중복 제거, API 매칭으로 정규화
 */
export async function canonicalizeTags(rawTags: string[]): Promise<string[]> {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const raw of rawTags) {
    const q = String(raw).replace(/^#\s*/, "").trim();
    if (!q) continue;

    const res = await getTagsByKeyword({ tagName: q });
    const resList: unknown = Array.isArray(res)
      ? res
      : (res as { data?: unknown })?.data ??
        (res as { content?: unknown })?.content ??
        (res as { results?: unknown })?.results;
    const list: unknown[] = Array.isArray(resList) ? resList : [];
    const names = list
      .map((t) =>
        typeof t === "string" ? t : (t as { name?: string })?.name ?? t
      )
      .filter(Boolean) as string[];
    const exact = names.find((n) => n.toLowerCase() === q.toLowerCase());
    const pick = (exact ?? names[0]) as string | undefined;
    const normalized = String(pick ?? q).trim();

    if (!seen.has(normalized.toLowerCase())) {
      seen.add(normalized.toLowerCase());
      out.push(normalized);
    }
  }
  return out;
}
