import type { TroubleShootingCardProps } from "@/components/MyPage/TroubleShootingCard";
import type { StatusType, VisibilityType } from "@/types/project";
import type { MyTroubleServerItem } from "@/types/troubles.server";
import { formatYYMMDD } from "@/utils/troubleFormat";

// 서버 상태 + 요약 생성 여부 -> 카드 StatusType
const toStatus = (
  postStatus?: string | null,
  isSummaryCreated?: boolean | null
): StatusType => {
  if (isSummaryCreated) return "created";
  const v = String(postStatus ?? "").trim();
  const U = v.toUpperCase();

  if (U === "COMPLETED" || v === "작성 완료") return "complete";
  if (
    U === "IN_PROGRESS" ||
    U === "DRAFT" ||
    v === "임시 저장" ||
    v === "작성 중"
  )
    return "inProgress";

  // 모호하면 완료로
  return "complete";
};

// boolean/string -> 카드 VisibilityType
const toVisibility = (
  raw?: boolean | string | null
): VisibilityType | undefined => {
  if (typeof raw === "boolean") return raw ? "public" : "private";
  const v = String(raw ?? "")
    .trim()
    .toUpperCase();
  if (v === "PUBLIC") return "public";
  if (v === "PRIVATE") return "private";
  return undefined;
};

// 소개문 -> 첫 본문 -> 빈 문자열
const pickContent = (x: MyTroubleServerItem): string =>
  x.introduction ?? x.contents?.[0].body ?? "";

// 서버 아이템 -> TroubleShootingCardProps
export const toTroubleShootingCard = (
  item: MyTroubleServerItem,
  opts?: { isMine?: boolean; authorName?: string; isSearchResult?: boolean }
): TroubleShootingCardProps => {
  const {
    isMine = true,
    authorName = "나",
    isSearchResult = true,
  } = opts ?? {};

  const status = toStatus(item.postStatus, item.isSummaryCreated);

  return {
    id: String(item.id),
    isMine,
    errorCategory: item.errorTag ?? "",
    title: item.title ?? "",
    content: pickContent(item),
    tags: item.postTags ?? [],
    importance: item.starRating ?? undefined,
    createdAt: item.createdAt ? formatYYMMDD(item.createdAt) : "",
    thumbnailUrl: item.thumbnailUrl ?? undefined,
    visibility: toVisibility(item.isVisible),
    summaryType:
      status === "created"
        ? item.contents?.[0]?.summaryType ?? undefined
        : undefined,
    status,
    likeCount: item.likeCount ?? undefined,
    commentCount: item.commentCount ?? undefined,
    authorName,
    isSearchResult,
    raw: item,
  };
};

export const toTroubleShootingCards = (
  items: MyTroubleServerItem[],
  opts: { isMine?: boolean; authorName?: string; isSearchResult?: boolean }
): TroubleShootingCardProps[] =>
  (items ?? []).map((it) => toTroubleShootingCard(it, opts));
