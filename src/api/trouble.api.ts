import type {
  GetProjectTroubleListResponse,
  GetTroubleListResponse,
  ProjectTroubleQuery,
} from "@/types/trouble.model";
import getAPIResponseData from "@/utils/getAPIResponseData";
import api from "./axios";

// 엔드포인트별 검색 응답 타입으로 분리
import type {
  MyTroubleSearchPage,
  UserTroubleSearchPage,
  CommunityTroubleSearchPage,
} from "@/types/troubles.server";

// 키별 디듀프(StrictMode 이펙트 2회 방지)
const inflightMy = new Map<string, Promise<MyTroubleSearchPage | null>>();
const inflightUser = new Map<string, Promise<UserTroubleSearchPage | null>>();
const inflightCommunity = new Map<
  string,
  Promise<CommunityTroubleSearchPage | null>
>();

/// 전체 트러블슈팅 목록 조회
export const getTroubleList = (
  page = 1,
  size = 10,
  sortBy: "latest" | "importance" = "latest"
) =>
  getAPIResponseData<GetTroubleListResponse>(
    api.get<GetTroubleListResponse>("/troubles/my/list", {
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

// 내 트러블슈팅 검색
export async function searchMyTroubles(params: {
  keyword: string;
  page?: number;
  size?: number;
}): Promise<MyTroubleSearchPage | null> {
  const { keyword, page = 1, size = 10 } = params;
  const p = Math.max(1, page);

  const key = `my::${keyword}::${p}::${size}`;
  if (!inflightMy.has(key)) {
    const promise = getAPIResponseData<MyTroubleSearchPage | null>({
      url: "troubles/my/search",
      method: "GET",
      params: { keyword, page: p, size },
    }).finally(() => setTimeout(() => inflightMy.delete(key), 0));
    inflightMy.set(key, promise);
  }
  return inflightMy.get(key)!;
}

// 특정 사용자 트러블슈팅 목록 조회 (카드)
export const getUserTroubleList = (userId: number, page = 1, size = 10) =>
  getAPIResponseData<GetTroubleListResponse>(
    api.get<GetTroubleListResponse>(`/troubles/users/${userId}/list`, {
      params: { page, size },
    })
  );

// 특정 사용자 트러블슈팅 검색
export async function searchUserTroubles(params: {
  userId: number;
  keyword: string;
  page?: number;
  size?: number;
}): Promise<UserTroubleSearchPage | null> {
  const { userId, keyword, page = 1, size = 10 } = params;
  const p = Math.max(1, page);

  const key = `user:${userId}::${keyword}::${p}::${size}`;
  if (!inflightUser.has(key)) {
    const promise = getAPIResponseData<UserTroubleSearchPage | null>({
      url: `/troubles/users/${userId}`,
      method: "GET",
      params: { keyword, page: p, size },
    }).finally(() => setTimeout(() => inflightUser.delete(key), 0));
    inflightUser.set(key, promise);
  }
  return inflightUser.get(key)!;
}

// 커뮤니티 검색
export async function searchCommunityTroubles(params: {
  keyword: string;
  page?: number;
  size?: number;
}): Promise<CommunityTroubleSearchPage | null> {
  const { keyword, page = 1, size = 10 } = params;
  const p = Math.max(1, page);

  const key = `community::${keyword}::${p}::${size}`;
  if (!inflightCommunity.has(key)) {
    const promise = getAPIResponseData<CommunityTroubleSearchPage | null>({
      url: "/community/search",
      method: "GET",
      params: { keyword, page: p, size },
    }).finally(() => setTimeout(() => inflightCommunity.delete(key), 0));
    inflightCommunity.set(key, promise);
  }
  return inflightCommunity.get(key)!;
}
