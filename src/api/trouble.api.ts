import type {
  GetProjectTroubleListResponse,
  GetTroubleListResponse,
  ProjectTroubleQuery,
  TroubleSort,
} from "@/types/trouble.model";
import getAPIResponseData from "@/utils/getAPIResponseData";
import api from "./axios";
import type { MyTroublesServerPage } from "@/types/troubles.server";

// 키별 디듀프(StrictMode 이펙트 2회 방지)
const inflight = new Map<string, Promise<MyTroublesServerPage | null>>();

/// 전체 트러블슈팅 목록 조회
export const getTroubleList = (
  page = 1,
  size = 10,
  sortBy: TroubleSort = "latest"
) =>
  getAPIResponseData<GetTroubleListResponse>(
    api.get<GetTroubleListResponse>("troubles/my/list", {
      params: { page, size, sortBy },
    })
  );

/// 프로젝트 내 트러블슈팅 목록 조회
export const getProjectTroubleList = (
  projectId: number,
  query: ProjectTroubleQuery
) =>
  getAPIResponseData<GetProjectTroubleListResponse>({
    url: `/projects/${projectId}/troubles`,
    method: "GET",
    params: query, // { status: 'COMPLETED'|'SUMMARIZED', ...선택 }
  });

// 사용자의 트러블슈팅 문서 기반 검색
export async function searchMyTroubles(params: {
  keyword: string;
  page?: number;
  size?: number;
}): Promise<MyTroublesServerPage | null> {
  const { keyword, page = 1, size = 10 } = params;
  const p = Math.max(1, page);

  const key = `my::${keyword}::${p}::${size}`;
  if (!inflight.has(key)) {
    const promise = getAPIResponseData<MyTroublesServerPage | null>({
      url: "/troubles/my",
      method: "GET",
      params: { keyword, page: p, size },
    }).finally(() => setTimeout(() => inflight.delete(key), 0));
    inflight.set(key, promise);
  }
  return inflight.get(key)!;
}
