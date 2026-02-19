import { useLocation } from "react-router-dom";
import { useViewerId } from "@/store/auth";

export type DetailFromSource =
  | "home"
  | "community"
  | "search"
  | "mypage"
  | "project"
  | undefined;

export type DetailSearchScope = "my" | "community" | undefined;

export interface UseDetailContextReturn {
  from: DetailFromSource;
  ownerId: number | undefined;
  viewerId: number | null;
  searchScope: DetailSearchScope;
  statusFromList: "inProgress" | "complete" | "created" | undefined;
  isVisibleFromList: boolean | undefined;
  summaryIdFromList: number | undefined;
  isMineFromList: boolean | undefined;
}

/**
 * 상세 페이지에서 location.state / query 로 전달된 출처·소유자·목록 힌트 등을 읽는 훅
 */
export function useDetailContext(): UseDetailContextReturn {
  const location = useLocation();
  const viewerIdInStore = useViewerId();

  const stateFrom = (location.state as Record<string, unknown>)?.from as DetailFromSource | undefined;
  const stateOwnerId = (location.state as Record<string, unknown>)?.ownerId as number | undefined;

  const qs = new URLSearchParams(location.search);
  const qsFrom = (qs.get("from") as DetailFromSource) || undefined;
  const qsOwnerId = qs.get("ownerId");
  const parsedQsOwnerId = qsOwnerId ? Number(qsOwnerId) : NaN;
  const ownerId =
    stateOwnerId ??
    (Number.isFinite(parsedQsOwnerId) ? parsedQsOwnerId : undefined);
  const from = stateFrom ?? qsFrom;

  const stateScope = (location.state as Record<string, unknown>)?.searchScope as
    | DetailSearchScope
    | undefined;
  const qsScope = (qs.get("scope") as DetailSearchScope) || undefined;
  const searchScope = stateScope ?? qsScope;

  const statusFromList = (location.state as Record<string, unknown>)?.statusFromList as
    | "inProgress"
    | "complete"
    | "created"
    | undefined;
  const isVisibleFromList = (location.state as Record<string, unknown>)?.isVisibleFromList as
    | boolean
    | undefined;
  const summaryIdFromList = (location.state as Record<string, unknown>)?.summaryIdFromList as
    | number
    | undefined;
  const isMineFromList = (location.state as Record<string, unknown>)?.isMineFromList as
    | boolean
    | undefined;

  return {
    from,
    ownerId,
    viewerId: viewerIdInStore,
    searchScope,
    statusFromList,
    isVisibleFromList,
    summaryIdFromList,
    isMineFromList,
  };
}
