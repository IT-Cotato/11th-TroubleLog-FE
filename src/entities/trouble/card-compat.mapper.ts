import type { TroublogCardProps } from "@/entities/trouble/ui/TroublogCard";
import type { TroubleShootingCardProps } from "@/entities/trouble/ui/TroubleShootingCard";

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
  thumbnailUrl: card.imageUrl,
  visibility: card.visibility,
  summaryType: card.summaryType,
  status: card.status,
  likeCount: card.likeCount,
  commentCount: card.commentCount,

  summaryId: card.summaryId ?? null,
  postSummaryId: (card as any).postSummaryId ?? null,
  summaries: (card as any).summaries ?? [],
});
