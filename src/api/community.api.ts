import getAPIResponseData from "@/utils/getAPIResponseData";
import api from "./axios";
import type {
  CommunityPostDetailServer,
  CommunitySort,
  GetCommunityCommentsResponse,
  GetCommunityListResponse,
} from "@/types/community.model";

// 중복 호출 방지용 (dev StrictMode 대비)
const inflightDetail = new Map<
  number,
  Promise<CommunityPostDetailServer | null>
>();
const inflightComments = new Map<
  string,
  Promise<GetCommunityCommentsResponse>
>();

// 커뮤니티 포스트 목록
export const getCommunityList = (
  page0 = 0,
  size = 12,
  sortBy: CommunitySort = "latest"
) =>
  getAPIResponseData<GetCommunityListResponse>(
    api.get<GetCommunityListResponse>("/community/list", {
      params: {
        page: Math.max(1, page0 + 1),
        size,
        sortBy,
      },
    })
  );

// 커뮤니티 포스트 상세 조회
export function getCommunityPostDetail(postId: number) {
  if (!inflightDetail.has(postId)) {
    const p = getAPIResponseData<CommunityPostDetailServer | null>({
      url: `/community/${postId}`,
      method: "GET",
    }).finally(() => setTimeout(() => inflightDetail.delete(postId), 0));
    inflightDetail.set(postId, p);
  }
  return inflightDetail.get(postId)!;
}

// 댓글 목록 조회
export function getCommunityComments(postId: number, page1 = 1, size = 10) {
  const key = `c:${postId}:${page1}:${size}`;
  if (!inflightComments.has(key)) {
    const p = getAPIResponseData<GetCommunityCommentsResponse>(
      api.get<GetCommunityCommentsResponse>(`/community/${postId}/comments`, {
        params: { page: Math.max(1, page1), size },
      })
    ).finally(() => {
      setTimeout(() => inflightComments.delete(key), 0);
    });
    inflightComments.set(key, p);
  }
  return inflightComments.get(key)!;
}
