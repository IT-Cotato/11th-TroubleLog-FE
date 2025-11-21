import type { TroublogCardProps } from "@/entities/trouble/ui/TroublogCard";
import type { CommunityServerCard } from "@/types/community.model";
import type { StatusType, VisibilityType } from "@/types/project";

// 한글 postStatus → 내부 StatusType 매핑
const mapStatus = (raw?: string | null): StatusType => {
  if (!raw) return "complete";
  switch (raw) {
    case "작성 중":
      return "inProgress";
    case "작성 완료":
      return "complete";
    case "요약 완료":
      return "created";
    default:
      return "complete";
  }
};

export const toCommunityCard = (s: CommunityServerCard): TroublogCardProps => {
  const owner = s.postCardUserInfoResDto ?? s.userInfo ?? null;

  const createdAt = s.completedAt ?? s.createdAt ?? "";

  // recent 응답일 때만 isVisible, postStatus가 채워져 있음
  const visibility: VisibilityType | undefined =
    typeof s.isVisible === "boolean"
      ? s.isVisible
        ? "public"
        : "private"
      : "public";

  const status: StatusType =
    s.postStatus != null ? mapStatus(s.postStatus) : "complete";

  return {
    id: s.id,
    isMine: false,
    status,
    visibility,
    errorCategory: s.errorTag ?? "",
    title: s.title ?? "",
    createdAt,
    tags: s.postTags ?? [],
    authorProfileImageUrl: owner?.profileImageUrl ?? undefined,
    authorId: owner?.userId,
    likeCount: s.likeCount ?? 0,
    commentCount: s.commentCount ?? 0,
    imageUrl: s.thumbnailUrl ?? "",
    isVisible: s.isVisible,
  };
};

export const toCommunityCards = (list: CommunityServerCard[]) =>
  (Array.isArray(list) ? list : []).map(toCommunityCard);
