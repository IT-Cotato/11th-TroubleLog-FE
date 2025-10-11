type AnyCard = Record<string, any>;

const norm = (s: unknown) => String(s ?? "").toUpperCase();

/** 응답이 다양한 케이스를 가정하고 summaryId를 추출 */
export function pickLatestSummaryId(x: AnyCard): number | null {
  if (!x) return null;

  // 1) 단일 필드가 바로 있는 경우
  const direct = x.summaryId ?? x.postSummaryId ?? null;
  if (direct != null && Number.isFinite(Number(direct))) return Number(direct);

  // 2) summaries 배열에서 최신(생성일 기준 ↓) 하나 고르기
  const arr =
    (Array.isArray(x.summaries) && x.summaries) ||
    (Array.isArray(x.summaryList) && x.summaryList) ||
    [];

  if (arr.length > 0) {
    const sorted = [...arr].sort((a, b) => {
      const ta = a.summaryCreatedAt
        ? new Date(a.summaryCreatedAt).getTime()
        : 0;
      const tb = b.summaryCreatedAt
        ? new Date(b.summaryCreatedAt).getTime()
        : 0;
      return tb - ta;
    });
    const cand = sorted[0]?.summaryId ?? sorted[0]?.id;
    if (cand != null && Number.isFinite(Number(cand))) return Number(cand);
  }

  return null;
}

/** 'SUMMARIZED' | 'CREATED' 등 요약 완료 상태를 통일 */
export function isSummarizedStatus(raw: unknown) {
  const s = norm(raw);
  return s === "SUMMARIZED" || s === "CREATED";
}

/** 내 글 판정 보조: 카드에 isMine이 있으면 우선, 없으면 authorId로 판정 */
export function isMineCard(card: AnyCard, viewerId?: number | null) {
  if (card?.isMine != null) return !!card.isMine;
  if (viewerId == null) return false;
  if (card?.authorId != null) return Number(card.authorId) === Number(viewerId);
  return false;
}

/** 합본 상세로 갈지/summaryId는 무엇인지 한 번에 반환 */
export function decideCombined(card: AnyCard, viewerId?: number | null) {
  const mine = isMineCard(card, viewerId);
  const summarized = isSummarizedStatus(card?.status);
  const sid = pickLatestSummaryId(card);
  return { goCombined: mine && summarized && sid != null, summaryId: sid };
}
