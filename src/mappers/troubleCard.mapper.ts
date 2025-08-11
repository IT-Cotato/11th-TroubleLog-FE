import type { TroublogCardProps } from "@/components/Card/TroublogCard";
import type { TroubleListItem } from "@/types/trouble.model";
import { formatYYMMDD } from "@/utils/troubleFormat";
import {
  mapStatus,
  mapSummaryType,
  mapVisibility,
} from "@/utils/troubleMapping";

export type TroublogCardVM = TroublogCardProps & { createdAtIso: string };

export const toTroublogCardVM = (t: TroubleListItem): TroublogCardVM => ({
  id: t.id,
  isMine: true, // 임시
  status: mapStatus(t.status),
  visibility: mapVisibility(t.isVisible),
  title: t.title,
  errorCategory: t.error,
  createdAt: formatYYMMDD(t.date),
  createdAtIso: t.date,
  tags: t.techs,
  importance: t.starRating,
  summaryType: mapSummaryType(t.summaryType),
});

export const toTroublogCardVMs = (list: TroubleListItem[]) =>
  list.map(toTroublogCardVM);
