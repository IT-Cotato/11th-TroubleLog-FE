import type { TroublogCardProps } from "@/components/Card/TroublogCard";
import type { CommunityServerCard } from "@/types/community.model";

export const toCommunityCard = (s: CommunityServerCard): TroublogCardProps => ({
  id: s.id,
  isMine: false,
  status: "complete",
  visibility: "public",
  errorCategory: s.errorTag ?? "",
  title: s.title ?? "",
  createdAt: s.completedAt ?? "",
  tags: s.postTags ?? [],
  authorProfileImageUrl: s.postCardUserInfoResDto?.profileImageUrl ?? undefined,
  authorId: s.postCardUserInfoResDto?.userId,
  likeCount: s.likeCount ?? 0,
  commentCount: s.commentCount ?? 0,
});

export const toCommunityCards = (list: CommunityServerCard[]) =>
  (Array.isArray(list) ? list : []).map(toCommunityCard);
