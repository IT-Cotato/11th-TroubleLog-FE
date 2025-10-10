import type { TroublogCardProps } from "@/components/Card/TroublogCard";
import type { TroubleListItem } from "@/entities/trouble/model";
import { pickLatestSummaryId } from "@/utils/combinedRoute";
import { formatYYMMDD } from "@/utils/troubleFormat";
import {
  mapStatus,
  mapSummaryType,
  mapVisibility,
} from "@/utils/troubleMapping";

export type TroublogCardVM = TroublogCardProps & { createdAtIso: string };

type AnySummary = {
  summaryId?: number;
  summaryType?: string; // "RESUME" | "INTERVIEW" | "BLOG" | "ISSUE_MANAGEMENT"
  summaryCreatedAt?: string;
};

function pickDisplaySummaryType(t: TroubleListItem): string | undefined {
  // 루트에 값이 오면 그걸 우선 사용
  if (t.summaryType) return t.summaryType as string;

  const list: AnySummary[] = Array.isArray(t.summaries)
    ? (t.summaries as AnySummary[])
    : [];
  if (list.length === 0) return undefined;

  // postSummaryId 우선
  let chosen: AnySummary | undefined =
    t.postSummaryId != null
      ? list.find((s) => s.summaryId === t.postSummaryId)
      : undefined;

  // 없으면 최신 summaryCreatedAt
  if (!chosen) {
    chosen = [...list].sort(
      (a, b) =>
        new Date(b.summaryCreatedAt ?? 0).getTime() -
        new Date(a.summaryCreatedAt ?? 0).getTime()
    )[0];
  }

  return chosen?.summaryType;
}

export const toTroublogCardVM = (t: TroubleListItem): TroublogCardVM => {
  const iso = t.date ?? "";

  // summaries에서 대표 요약 enum을 뽑아 라벨 매핑
  const enumType = pickDisplaySummaryType(t);
  const label = enumType ? mapSummaryType(enumType) : undefined;

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
    summaryType: label,
    imageUrl: t.imageUrl ?? "",
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
