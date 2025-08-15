import type { TroubleListItem } from "@/types/trouble.model";
import type { MyTroubleServerItem } from "@/types/troubles.server";

// 서버 -> 공통 도메인 (TroubleListItem)
export const serverToTroubleListItem = (
  x: MyTroubleServerItem
): TroubleListItem => ({
  id: x.id,
  projectId: x.projectId ?? 0,
  title: x.title ?? "",
  imageUrl: x.thumbnailUrl ?? "",
  isVisible: x.isVisible,
  date: x.createdAt,
  starRating: x.starRating ?? 0,
  error: x.errorTag ?? "",
  techs: x.postTags ?? [],
  status: x.postStatus ?? "",
  summaryType: x.contents?.[0]?.summaryType ?? "NONE",
});
