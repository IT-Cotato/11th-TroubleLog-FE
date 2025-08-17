import type { TroubleShootingCardProps } from "@/components/MyPage/TroubleShootingCard";
import type { StatusType, VisibilityType } from "@/types/project";
import type {
  MyTroubleDetailItem,
  CommunityTroubleSearchItem,
  TroubleSearchCard,
} from "@/types/troubles.server";
import { formatYYMMDD } from "@/utils/troubleFormat";

// 타입 가드
const has = (o: unknown, k: string) => !!o && typeof o === "object" && k in o;

const toStatus = (
  postStatus?: string | null,
  isSummaryCreated?: boolean | null,
  completedAt?: string | null
): StatusType => {
  if (isSummaryCreated) return "created";
  const v = String(postStatus ?? "").trim();
  const U = v.toUpperCase();
  if (U === "COMPLETED" || v === "작성 완료") return "complete";
  if (
    U === "IN_PROGRESS" ||
    U === "WRITING" ||
    v === "임시 저장" ||
    v === "작성 중"
  )
    return "inProgress";
  if (completedAt != null) return "complete";
  return "complete";
};

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

const pickContent = (
  item: MyTroubleDetailItem | CommunityTroubleSearchItem | TroubleSearchCard
): string => {
  if (has(item, "introduction") && (item as any).introduction) {
    return (item as any).introduction as string;
  }
  if (has(item, "contents") && Array.isArray((item as any).contents)) {
    const c0 = (item as any).contents?.[0];
    if (c0?.body) return c0.body as string;
  }
  return "";
};

export const toTroubleShootingCard = (
  item: MyTroubleDetailItem | CommunityTroubleSearchItem | TroubleSearchCard,
  opts?: { isMine?: boolean; authorName?: string; isSearchResult?: boolean }
): TroubleShootingCardProps => {
  const {
    isMine = true,
    authorName = "나",
    isSearchResult = true,
  } = opts ?? {};

  const status = toStatus(
    has(item, "postStatus") ? (item as any).postStatus : null,
    has(item, "isSummaryCreated") ? (item as any).isSummaryCreated : null,
    has(item, "completedAt") ? (item as any).completedAt : null
  );

  const createdAt =
    has(item, "createdAt") && (item as any).createdAt
      ? formatYYMMDD((item as any).createdAt as string)
      : has(item, "completedAt") && (item as any).completedAt
      ? ((item as any).completedAt as string)
      : "";

  const summaryType =
    status === "created" &&
    has(item, "contents") &&
    Array.isArray((item as any).contents)
      ? (item as any).contents?.[0]?.summaryType ?? undefined
      : undefined;

  return {
    id: String((item as any).id),
    isMine,
    errorCategory: (item as any).errorTag ?? "",
    title: (item as any).title ?? "",
    content: pickContent(item),
    tags: (item as any).postTags ?? [],
    importance: (item as any).starRating ?? undefined,
    createdAt,
    thumbnailUrl: (item as any).thumbnailUrl ?? undefined,
    visibility: has(item, "isVisible")
      ? toVisibility((item as any).isVisible)
      : undefined,
    summaryType,
    status,
    likeCount: (item as any).likeCount ?? undefined,
    commentCount: (item as any).commentCount ?? undefined,
    authorName,
    isSearchResult,
  } as TroubleShootingCardProps;
};
