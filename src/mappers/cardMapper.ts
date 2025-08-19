import type { TroublogCardProps } from "@/components/Card/TroublogCard";
import type { TroubleShootingCardProps } from "@/components/MyPage/TroubleShootingCard";

export const mapToTroubleShootingCard = (
  card: TroublogCardProps
): TroubleShootingCardProps => ({
  id: String(card.id),
  isMine: card.isMine,
  errorCategory: card.errorCategory,
  title: card.title,
  content: card.introduction ?? "",
  tags: card.tags,
  importance: card.importance,
  createdAt: card.createdAt,
  thumbnailUrl: undefined,
  visibility: card.visibility,
  summaryType: card.summaryType,
  status: card.status,
  likeCount: card.likeCount,
  commentCount: card.commentCount,
});
