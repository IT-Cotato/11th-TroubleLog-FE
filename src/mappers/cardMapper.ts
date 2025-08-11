import type { TroublogCardProps } from "@/components/Card/TroublogCard";
import type { TroubleShootingCardProps } from "@/components/MyPage/TroubleShootingCard";

export const mapToTroubleShootingCard = (
  card: TroublogCardProps
): TroubleShootingCardProps => ({
  id: String(card.id),
  isMine: card.isMine,
  errorCategory: card.errorCategory,
  title: card.title,
  content:
    "프론트엔드 개발 중 React 앱에서 백엔드 API(Spring Boot 서버)에 데이터를 요청했는데, 브라우저 콘솔에서 CORS policy: No 'Access-Control-Allow-Origin' header 오류가 발생했습니다. 로컬 개발 환경에서는 정상 작동했으나, EC2에 배포한 서버에서만 해당 오류가 발생했습니다.",
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
