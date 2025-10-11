import type { LikedPostServerItem } from "@/types/community.model";
import type { TroubleShootingCardProps } from "@/entities/trouble/ui/TroubleShootingCard";

// YY.MM.DD
const fmtYYMMDD = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}.${mm}.${dd}`;
};

export const toLikedCard = (
  s: LikedPostServerItem
): TroubleShootingCardProps => {
  const preview =
    Array.isArray(s.contents) && s.contents.length > 0 ? s.contents[0] : "";

  return {
    id: String(s.postId),
    isMine: false,
    errorCategory: s.errorTags ?? "",
    title: s.title ?? "",
    content: preview,
    tags: s.techTags ?? [],
    importance: undefined,
    createdAt: fmtYYMMDD(s.createdAt),
    thumbnailUrl:
      Array.isArray(s.images) && s.images.length > 0 ? s.images[0] : undefined,
    visibility: undefined,
    summaryType: undefined,
    status: "complete",
    likeCount: s.likeCount ?? 0,
    commentCount: s.commentCount ?? 0,
    authorName: undefined,
    isSearchResult: false,
  };
};

export const toLikedCards = (list: LikedPostServerItem[]) =>
  (list ?? []).map(toLikedCard);
