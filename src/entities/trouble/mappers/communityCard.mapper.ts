import type { TroublogCardProps } from "@/entities/trouble/ui/TroublogCard";
import type { CommunityServerCard } from "@/types/community.model";

export const toCommunityCard = (s: CommunityServerCard): TroublogCardProps => {
  const owner = s.postCardUserInfoResDto ?? s.userInfo ?? null;

  const createdAt = s.completedAt ?? s.createdAt ?? "";

  return {
    id: s.id,
    isMine: false,
    status: "complete",
    visibility: "public",
    errorCategory: s.errorTag ?? "",
    title: s.title ?? "",
    createdAt,
    tags: s.postTags ?? [],
    authorProfileImageUrl: owner?.profileImageUrl ?? undefined,
    authorId: owner?.userId,
    likeCount: s.likeCount ?? 0,
    commentCount: s.commentCount ?? 0,
    imageUrl: s.thumbnailUrl ?? "",
  };
};

export const toCommunityCards = (list: CommunityServerCard[]) =>
  (Array.isArray(list) ? list : []).map(toCommunityCard);
