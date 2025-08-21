import type { TroublogCardProps } from "@/components/Card/TroublogCard";
import type { TroubleListItem } from "@/types/trouble.model";
import { pickLatestSummaryId } from "@/utils/combinedRoute";
import { formatYYMMDD } from "@/utils/troubleFormat";
import {
  mapStatus,
  mapSummaryType,
  mapVisibility,
} from "@/utils/troubleMapping";

export type TroublogCardVM = TroublogCardProps & { createdAtIso: string };

export const toTroublogCardVM = (t: TroubleListItem): TroublogCardVM => {
  const iso = t.date ?? "";
  return {
    id: t.id,
    isMine: true, // 서버에 소유자 정보가 오면 교체
    status: mapStatus(t.status),
    visibility: mapVisibility(t.isVisible as any), // boolean 기반이지만 호환 고려
    title: t.title ?? "",
    errorCategory: t.error ?? "",
    createdAt: iso ? formatYYMMDD(iso) : "",
    createdAtIso: iso,
    tags: Array.isArray(t.techs) ? t.techs : [],
    importance: t.starRating ?? 0,
    summaryType: mapSummaryType(t.summaryType),
    imageUrl: t.imageUrl ?? undefined,
    likeCount: t.likeCount ?? undefined,
    commentCount: t.commentCount ?? undefined,
    introduction: t.introduction ?? undefined,

    summaryId: pickLatestSummaryId(t) ?? undefined,
    postSummaryId: t.postSummaryId ?? undefined,
    summaries: t.summaries ?? [],
  };
};

export const toTroublogCardVMs = (list: TroubleListItem[]) =>
  (Array.isArray(list) ? list : []).map(toTroublogCardVM);
