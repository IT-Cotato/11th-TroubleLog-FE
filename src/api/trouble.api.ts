import type {
  GetProjectTroubleListResponse,
  GetTroubleListResponse,
  ProjectTroubleQuery,
} from "@/types/trouble.model";
import getAPIResponseData from "@/utils/getAPIResponseData";
import api from "./axios";
import type { MyTroublesServerPage } from "@/types/troubles.server";

// 키별 디듀프(StrictMode 이펙트 2회 방지)
const inflight = new Map<string, Promise<MyTroublesServerPage | null>>();
const inflightUser = new Map<string, Promise<MyTroublesServerPage | null>>();
const inflightCommunity = new Map<
  string,
  Promise<MyTroublesServerPage | null>
>();

/// 전체 트러블슈팅 목록 조회
export const getTroubleList = (
  page = 1,
  size = 10,
  sortBy: "latest" | "likes" = "latest"
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
      url: "/troubles/my/search",
      method: "GET",
      params: { keyword, page: p, size },
    }).finally(() => setTimeout(() => inflight.delete(key), 0));
    inflight.set(key, promise);
  }
  return inflight.get(key)!;
}

// 특정 사용자의 트러블슈팅 문서 기반 검색
export async function searchUserTroubles(params: {
  userId: number;
  keyword: string;
  page?: number;
  size?: number;
}): Promise<MyTroublesServerPage | null> {
  const { userId, keyword, page = 1, size = 10 } = params;
  const p = Math.max(1, page);

  const key = `user:${userId}::${keyword}::${p}::${size}`;
  if (!inflightUser.has(key)) {
    const promise = getAPIResponseData<MyTroublesServerPage | null>({
      url: `/troubles/users/${userId}/search`,
      method: "GET",
      params: { keyword, page: p, size },
    }).finally(() => setTimeout(() => inflightUser.delete(key), 0));
    inflightUser.set(key, promise);
  }
  return inflightUser.get(key)!;
}

// 공개 커뮤니티 검색 (제목/본문/태그)
export async function searchCommunityTroubles(params: {
  keyword: string;
  page?: number;
  size?: number;
}): Promise<MyTroublesServerPage | null> {
  const { keyword, page = 1, size = 10 } = params;
  const p = Math.max(1, page); // ← 서버는 1부터

  const key = `community::${keyword}::${p}::${size}`;
  if (!inflightCommunity.has(key)) {
    const promise = getAPIResponseData<MyTroublesServerPage | null>({
      url: "/community/search",
      method: "GET",
      params: { keyword, page: p, size },
    }).finally(() => setTimeout(() => inflightCommunity.delete(key), 0));
    inflightCommunity.set(key, promise);
  }
  return inflightCommunity.get(key)!;
}
